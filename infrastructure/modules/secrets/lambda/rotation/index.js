/**
 * AWS Secrets Manager Rotation Lambda for DocumentDB Credentials
 *
 * Implements the four-step rotation protocol:
 * 1. createSecret  - Generate a new password and store as AWSPENDING
 * 2. setSecret     - Update the DocumentDB user password
 * 3. testSecret    - Verify the new credentials work
 * 4. finishSecret  - Move AWSPENDING to AWSCURRENT
 *
 *  11.5 (automatic rotation every 90 days)
 *               11.6 (Lambda retrieves updated secrets without redeployment)
 */

const {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
  DescribeSecretCommand,
  UpdateSecretVersionStageCommand,
  GetRandomPasswordCommand,
} = require("@aws-sdk/client-secrets-manager");

const { MongoClient } = require("mongodb");

const secretsManager = new SecretsManagerClient({
  endpoint: process.env.SECRETS_MANAGER_ENDPOINT,
});

/**
 * Main handler invoked by Secrets Manager during rotation.
 */
exports.handler = async (event) => {
  const { SecretId, ClientRequestToken, Step } = event;

  console.log(
    JSON.stringify({
      message: "Rotation step invoked",
      secretId: SecretId,
      step: Step,
      clientRequestToken: ClientRequestToken,
    })
  );

  // Verify the secret exists and rotation is enabled
  const metadata = await secretsManager.send(
    new DescribeSecretCommand({ SecretId })
  );

  if (!metadata.RotationEnabled) {
    throw new Error(`Secret ${SecretId} does not have rotation enabled.`);
  }

  // Verify the version is staged as AWSPENDING
  const versions = metadata.VersionIdsToStages || {};
  if (
    !versions[ClientRequestToken] ||
    versions[ClientRequestToken].includes("AWSCURRENT")
  ) {
    console.log(
      "Secret version already set as AWSCURRENT. No rotation needed."
    );
    return;
  }

  if (!versions[ClientRequestToken].includes("AWSPENDING")) {
    throw new Error(
      `Secret version ${ClientRequestToken} not set as AWSPENDING.`
    );
  }

  switch (Step) {
    case "createSecret":
      await createSecret(SecretId, ClientRequestToken);
      break;
    case "setSecret":
      await setSecret(SecretId, ClientRequestToken);
      break;
    case "testSecret":
      await testSecret(SecretId, ClientRequestToken);
      break;
    case "finishSecret":
      await finishSecret(SecretId, ClientRequestToken);
      break;
    default:
      throw new Error(`Unknown rotation step: ${Step}`);
  }
};

/**
 * Step 1: Generate a new password and store it as AWSPENDING.
 */
async function createSecret(secretId, clientRequestToken) {
  // Get the current secret value
  const currentSecret = await getSecretValue(secretId, "AWSCURRENT");
  const secretData = JSON.parse(currentSecret);

  // Generate a new random password (30 chars, no special chars that break MongoDB URIs)
  const passwordResponse = await secretsManager.send(
    new GetRandomPasswordCommand({
      PasswordLength: 30,
      ExcludeCharacters: '/@"\\\'',
      RequireEachIncludedType: true,
    })
  );

  // Store the new secret with the updated password
  const newSecretData = {
    ...secretData,
    password: passwordResponse.RandomPassword,
  };

  await secretsManager.send(
    new PutSecretValueCommand({
      SecretId: secretId,
      ClientRequestToken: clientRequestToken,
      SecretString: JSON.stringify(newSecretData),
      VersionStages: ["AWSPENDING"],
    })
  );

  console.log("createSecret: New password generated and stored as AWSPENDING.");
}

/**
 * Step 2: Update the DocumentDB user password with the new credential.
 */
async function setSecret(secretId, clientRequestToken) {
  // Get the current (still active) credentials to connect
  const currentSecret = await getSecretValue(secretId, "AWSCURRENT");
  const currentData = JSON.parse(currentSecret);

  // Get the pending credentials with the new password
  const pendingSecret = await getSecretValue(secretId, "AWSPENDING");
  const pendingData = JSON.parse(pendingSecret);

  // Connect to DocumentDB using current credentials
  const uri = buildConnectionUri(currentData);
  const client = new MongoClient(uri, {
    tls: true,
    tlsCAFile: "/opt/rds-combined-ca-bundle.pem",
    retryWrites: false,
    directConnection: true,
  });

  try {
    await client.connect();
    const adminDb = client.db("admin");

    // Update the user's password
    await adminDb.command({
      updateUser: pendingData.username,
      pwd: pendingData.password,
    });

    console.log(
      `setSecret: Password updated for user '${pendingData.username}'.`
    );
  } finally {
    await client.close();
  }
}

/**
 * Step 3: Verify the new credentials can connect to DocumentDB.
 */
async function testSecret(secretId, clientRequestToken) {
  // Get the pending credentials
  const pendingSecret = await getSecretValue(secretId, "AWSPENDING");
  const pendingData = JSON.parse(pendingSecret);

  // Attempt to connect with the new credentials
  const uri = buildConnectionUri(pendingData);
  const client = new MongoClient(uri, {
    tls: true,
    tlsCAFile: "/opt/rds-combined-ca-bundle.pem",
    retryWrites: false,
    directConnection: true,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    // Run a simple command to verify connectivity
    await client.db("admin").command({ ping: 1 });
    console.log("testSecret: New credentials verified successfully.");
  } finally {
    await client.close();
  }
}

/**
 * Step 4: Finalize rotation by moving AWSPENDING to AWSCURRENT.
 */
async function finishSecret(secretId, clientRequestToken) {
  // Get the current version
  const metadata = await secretsManager.send(
    new DescribeSecretCommand({ SecretId: secretId })
  );

  const versions = metadata.VersionIdsToStages || {};
  let currentVersionId = null;

  for (const [versionId, stages] of Object.entries(versions)) {
    if (stages.includes("AWSCURRENT") && versionId !== clientRequestToken) {
      currentVersionId = versionId;
      break;
    }
  }

  // Move AWSCURRENT from old version to new version
  await secretsManager.send(
    new UpdateSecretVersionStageCommand({
      SecretId: secretId,
      VersionStage: "AWSCURRENT",
      MoveToVersionId: clientRequestToken,
      RemoveFromVersionId: currentVersionId,
    })
  );

  console.log(
    `finishSecret: Version ${clientRequestToken} is now AWSCURRENT.`
  );
}

/**
 * Helper: Retrieve a secret value by version stage.
 */
async function getSecretValue(secretId, versionStage) {
  const response = await secretsManager.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionStage: versionStage,
    })
  );
  return response.SecretString;
}

/**
 * Helper: Build a MongoDB connection URI from secret data.
 */
function buildConnectionUri(secretData) {
  const { username, password, host, port } = secretData;
  const encodedPassword = encodeURIComponent(password);
  return `mongodb://${username}:${encodedPassword}@${host}:${port}/admin`;
}
