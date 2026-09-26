# Taskly Frontend

Modern, responsive task management application built with React and Vite.

## Features

- **Modern UI**: Clean, intuitive interface with dark mode support
- **Real-time Updates**: Instant synchronization across devices
- **Responsive Design**: Mobile-first approach, works on all devices
- **Rich Task Management**: Create, edit, organize tasks with priorities and tags
- **Team Collaboration**: Work together with team members on projects
- **Analytics Dashboard**: Track productivity and completion rates
- **Calendar View**: Visualize tasks in calendar format
- **File Uploads**: Avatar and attachment management
- **Notifications**: Real-time in-app notifications

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Context API
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Icons**: Heroicons

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend API running (see backend/README.md)

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Taskly
VITE_APP_VERSION=1.0.0
```

## Development

### Start Development Server

```bash
npm run dev
```

Application runs on `http://localhost:3000` with hot module replacement.

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm test
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable components
│   │   ├── common/    # Shared components
│   │   ├── layout/    # Layout components
│   │   ├── task/      # Task-related components
│   │   ├── team/      # Team components
│   │   └── project/   # Project components
│   ├── context/        # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── TaskContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   │   ├── Login.jsx
│   │   ├── Tasks.jsx
│   │   ├── Projects.jsx
│   │   └── Teams.jsx
│   ├── services/       # API services
│   │   ├── api.js
│   │   ├── taskService.js
│   │   └── authService.js
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Root component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── .env.example        # Environment template
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── package.json
```

## Building for Production

### 1. Configure Environment

Create `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Taskly
VITE_APP_VERSION=1.0.0
```

### 2. Build Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 3. Test Production Build Locally

```bash
npm run preview
```

Preview runs on `http://localhost:4173`

## Production Deployment

### Option 1: Static Hosting (Vercel, Netlify)

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**vercel.json** configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://api.yourdomain.com/api"
  }
}
```

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

**netlify.toml** configuration:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_API_URL = "https://api.yourdomain.com/api"
```

### Option 2: Docker Deployment

**Dockerfile**:

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Build and run**:

```bash
# Build image
docker build -t taskly-frontend .

# Run container
docker run -p 80:80 taskly-frontend
```

### Option 3: Traditional Web Server

#### Build

```bash
npm run build
```

#### Deploy to Server

```bash
# Copy dist folder to server
scp -r dist/* user@server:/var/www/taskly

# Or use rsync
rsync -avz dist/ user@server:/var/www/taskly/
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/taskly;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

#### Apache Configuration (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

## Environment Variables

### Development

```env
VITE_API_URL=http://localhost:5000/api
```

### Production

```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Important**: All environment variables must be prefixed with `VITE_` to be accessible in the application.

## Performance Optimization

### Code Splitting

The application uses React lazy loading for route-based code splitting:

```javascript
const Tasks = lazy(() => import('./pages/Tasks'));
const Projects = lazy(() => import('./pages/Projects'));
```

### Image Optimization

- Use WebP format when possible
- Implement lazy loading for images
- Use appropriate image sizes

### Bundle Analysis

```bash
npm run build -- --mode analyze
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Connection Issues

- Verify `VITE_API_URL` is correct
- Check CORS configuration on backend
- Ensure backend is running

### Routing Issues in Production

- Verify server is configured for SPA routing
- Check that all requests fallback to `index.html`

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_`
- Rebuild after changing environment variables
- Check `.env` file is in the correct location

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with sensitive data
2. **API Keys**: Use environment variables for all API keys
3. **HTTPS**: Always use HTTPS in production
4. **CSP**: Implement Content Security Policy headers
5. **XSS Protection**: Sanitize user inputs
6. **Dependencies**: Keep dependencies updated

## Performance Metrics

Target metrics for production:

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90

## Monitoring

### Error Tracking

Consider integrating:
- Sentry for error tracking
- Google Analytics for usage analytics
- LogRocket for session replay

### Performance Monitoring

- Use Lighthouse CI for automated performance testing
- Monitor Core Web Vitals
- Track bundle size changes

## CI/CD Pipeline Example

**GitHub Actions** (.github/workflows/deploy.yml):

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
        
      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

## Support

For issues and questions:
- Check documentation
- Review browser console for errors
- Verify API connectivity

