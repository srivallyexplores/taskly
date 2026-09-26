# Taskly backend

Node.js API that runs on AWS Lambda behind API Gateway. Locally it's still a regular Express server on port 5000.

## What's in here

- Express 5 app wrapped with `@vendia/serverless-express` for Lambda
- Cognito JWT auth (falls back to local JWT when Cognito env vars aren't set)
- DocumentDB via Mongoose (same queries as MongoDB, just runs on AWS)
- S3 pre-signed URLs for file uploads (replaces Cloudinary)
- EventBridge for async event processing (achievements, notifications)
- SES for transactional email via SQS queue
- Structured JSON logging with correlation IDs

## Running locally

You need Node 20+ and MongoDB running somewhere.

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MongoDB URI and secrets
npm run dev
```

Server starts on `http://localhost:5000`. The Lambda/Cognito/S3 stuff is bypassed in local dev — it uses local JWT auth, local MongoDB, and skips S3 uploads.

### Seed data

```bash
npm run seed
```

Creates test users, teams, projects, and tasks.

## Environment variables

The `.env.example` has everything documented. The minimum to get running locally:

```
MONGODB_URI=mongodb://localhost:27017/taskly
SESSION_SECRET=anything-random
JWT_SECRET=different-random-string
CLIENT_URL=http://localhost:3000
```

For AWS features (optional locally):

```
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxxxx
S3_UPLOAD_BUCKET=taskly-dev-uploads
EVENT_BUS_NAME=taskly-dev-events
EMAIL_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
SES_FROM_EMAIL=noreply@taskly.app
```

## How it runs in production

In Lambda, `AWS_LAMBDA_FUNCTION_NAME` is set automatically. The server detects this and exports the Express app instead of calling `app.listen()`. The Lambda handler (`lambda/handler.js`) wraps it with serverless-express.

Request flow: API Gateway → Lambda → Express router → DocumentDB

The handler manages DB connection pooling across warm invocations and injects correlation IDs from the Lambda context.

## Project structure

```
backend/
├── config/
│   ├── aws.js              # AWS SDK clients (S3, SES, EventBridge, Secrets Manager)
│   ├── passport.js         # Passport.js local strategy
│   └── production.js       # Production config loader (reads from Secrets Manager)
├── controllers/            # Route handlers
├── lambda/
│   ├── handler.js          # Lambda entry point (serverless-express wrapper)
│   ├── processors/
│   │   ├── achievement-processor.js  # EventBridge consumer: task.completed
│   │   ├── notification-processor.js # EventBridge consumer: team/project events
│   │   ├── email-processor.js        # SQS consumer: sends emails via SES
│   │   └── image-processor.js        # S3 trigger: resizes avatars to 400x400
│   └── triggers/
│       ├── post-confirmation.js      # Cognito trigger: creates user record
│       └── pre-token-generation.js   # Cognito trigger: adds custom claims
├── middleware/
│   ├── auth.js             # Cognito JWT + local JWT validation
│   ├── security.js         # Helmet, rate limiting, sanitization
│   └── validation.js       # Request validation
├── models/                 # Mongoose schemas
├── routes/                 # Express route definitions
├── services/
│   ├── emailService.js     # SES email sending with SQS buffering
│   └── eventService.js     # EventBridge event publishing
├── utils/
│   ├── logger.js           # Structured JSON logging
│   └── secrets.js          # Secrets Manager with caching + rotation handling
├── tests/
│   ├── unit/               # Lambda handler, auth middleware, S3 presign tests
│   ├── integration/        # DocumentDB connectivity, AWS integration tests
│   └── services/           # Email service tests
└── server.js               # Express app (exports for Lambda, listens for local)
```

## Tests

```bash
npm test                    # all tests
npm test -- --project=unit  # just unit tests (no DB needed)
npm run test:coverage       # with coverage report
```

Unit tests mock AWS services. Integration tests need either a real MongoDB or use mongodb-memory-server.

The AWS integration tests (`tests/integration/aws-integration.test.js`) need a deployed environment and `API_GATEWAY_URL` + `TEST_AUTH_TOKEN` env vars. They're skipped by default.

## API routes

All routes are under `/api/`. Auth routes are public, everything else needs a Bearer token.

| Route | Auth | Description |
|-------|------|-------------|
| POST /api/auth/register | No | Create account |
| POST /api/auth/login | No | Get session/token |
| GET /api/auth/me | Yes | Current user |
| GET /api/tasks | Yes | List tasks (paginated, filterable) |
| POST /api/tasks | Yes | Create task |
| PATCH /api/tasks/:id/complete | Yes | Mark task done (publishes event) |
| GET /api/teams | Yes | List teams |
| POST /api/teams/:id/invite | Yes | Invite user (publishes event) |
| POST /api/upload/avatar/presign | Yes | Get S3 pre-signed upload URL |
| GET /api/health | No | Health check |

Full API docs are in `API_DOCUMENTATION.md` at the repo root.

## Deployment

Handled by GitHub Actions (`.github/workflows/backend-deploy.yml`):

1. Lint + unit tests
2. Package Lambda zip (production deps only, no tests/seeds)
3. Upload to S3 deploy bucket
4. Update Lambda function code
5. Canary: shift 10% traffic to new version
6. Monitor error rate for 5 minutes
7. Promote to 100% or auto-rollback if errors > 1%

## Architecture decisions

**Why Lambda over ECS/EC2:** Zero cost at idle, auto-scaling, no server management. Cold starts are acceptable (under 3s) for a task management app.

**Why DocumentDB over DynamoDB:** The existing codebase uses Mongoose with complex queries, text search, and aggregation pipelines. Rewriting for DynamoDB would be a full rewrite. DocumentDB is MongoDB-compatible so the Mongoose code works as-is.

**Why sessions + Cognito:** Cognito handles the hard auth stuff (MFA, OAuth, token lifecycle). The app validates Cognito JWTs on each request. Local dev still works with plain JWT for convenience.

**Why EventBridge over direct Lambda invocation:** Decouples the API from background processing. If the achievement processor is broken, task completion still works. Failed events go to a dead letter queue for retry.
