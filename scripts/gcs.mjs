import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Storage, TransferManager } from '@google-cloud/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');

const result = dotenv.config({ path: envPath });
if (result.error) {
    console.log('Error loading .env.local:', result.error);
}


const directoryName = 'dist';
const bucketName = process.env.GCS_BUCKET_NAME;
const origin = ['*'];
const responseHeader = ['Content-Type'];
const maxAgeSeconds = 3600;

// https://cloud.google.com/appengine/docs/standard/java/javadoc/com/google/appengine/api/urlfetch/HTTPMethod
const method = ['GET'];

if (!bucketName) {
  console.error('Error: GCS_BUCKET_NAME environment variable is not set.');
  process.exit(1);
}

const storage = new Storage();
const bucket = storage.bucket(bucketName);
const transferManager = new TransferManager(storage.bucket(bucketName));


async function configureCorsAndUploadDirectoryWithTransferManager() {
  try {
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds,
        method: method,
        origin: origin,
        responseHeader: responseHeader,
      },
    ]);

    console.log(`Bucket ${bucketName} CORS configuration updated to allow ${method} requests from ${origin} sharing ${responseHeader} responses.`);

    console.log(`Fetching CORS configuration for bucket '${bucketName}' to verify...`);
    const [metadata] = await bucket.getMetadata();
    console.log('Current CORS configuration on bucket:', JSON.stringify(metadata, null, 2));

    await transferManager.uploadManyFiles(directoryName);
    console.log(`${directoryName} uploaded to ${bucketName}.`);
  } catch (error) {
    console.error(`Error uploading ${directoryName} to ${bucketName}:`, error);
    process.exit(1);
  }
}

configureCorsAndUploadDirectoryWithTransferManager();