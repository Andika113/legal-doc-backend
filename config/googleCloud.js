const { Storage } = require('@google-cloud/storage');
const { TranslationServiceClient } = require('@google-cloud/translate').v2;
require('dotenv').config();

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_PROJECT_ID
});

const translateClient = new TranslationServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const bucket = storage.bucket(process.env.BUCKET_NAME);

module.exports = {
  storage,
  translateClient,
  bucket
};