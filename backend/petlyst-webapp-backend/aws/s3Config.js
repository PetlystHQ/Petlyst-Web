const AWS = require('aws-sdk');
require('dotenv').config();
const logger = require('../config/logger');

// Validate essential config
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
  logger.error('CRITICAL: Missing required AWS configuration:');
  logger.error({
    accessKeyExists: !!process.env.AWS_ACCESS_KEY_ID,
    secretKeyExists: !!process.env.AWS_SECRET_ACCESS_KEY,
    regionExists: !!process.env.AWS_REGION,
    bucketExists: !!process.env.AWS_S3_BUCKET
  });
  logger.error('Please check your .env file for proper AWS configuration');
}

// Log environment variables (redacted)
logger.info('S3 Config Environment Check:', {
  accessKeyExists: !!process.env.AWS_ACCESS_KEY_ID,
  secretKeyExists: !!process.env.AWS_SECRET_ACCESS_KEY,
  regionExists: !!process.env.AWS_REGION,
  bucketExists: !!process.env.AWS_S3_BUCKET,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET
});

const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET
};

// Configure AWS SDK with additional options
const s3 = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
  // Add custom options to help with debugging and reliability
  httpOptions: {
    timeout: 30000, // 30 seconds timeout
    connectTimeout: 5000 // 5 seconds connection timeout
  },
  maxRetries: 3 // Retry failed requests up to 3 times
});

// More comprehensive S3 connection testing
logger.info('Testing S3 connection and permissions...');

// Test S3 connection on startup
const testS3Connection = async () => {
  try {
    // Test listing buckets (tests basic connectivity and credentials)
    const listBucketsResult = await s3.listBuckets().promise();
    logger.info('S3 Connection Successful. Available buckets:', 
      listBucketsResult.Buckets.map(b => b.Name).join(', '));
    
    // Verify our target bucket exists
    if (listBucketsResult.Buckets.some(b => b.Name === s3Config.bucket)) {
      logger.info(`Target bucket '${s3Config.bucket}' found and accessible`);
      
      // Test put object permission with a temporary file
      const testKey = `test-config/test-${Date.now()}.txt`;
      try {
        const putResult = await s3.putObject({
          Bucket: s3Config.bucket,
          Key: testKey,
          Body: 'Test file to verify write permissions',
          ContentType: 'text/plain'
        }).promise();
        
        logger.info('Write permission test successful:', {
          ETag: putResult.ETag,
          testKey: testKey,
          bucket: s3Config.bucket
        });
        
        // Try to get the object to verify public-read access
        const url = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${testKey}`;
        logger.info(`Test object should be accessible at: ${url}`);
        
        // Clean up test file
        await s3.deleteObject({
          Bucket: s3Config.bucket,
          Key: testKey
        }).promise();
        
      } catch (putError) {
        logger.error('CRITICAL: Failed to write test object to bucket - check bucket permissions:', putError);
      }
    } else {
      logger.error(`WARNING: Target bucket '${s3Config.bucket}' not found in available buckets. Check bucket name and permissions.`);
    }
  } catch (error) {
    logger.error('CRITICAL: S3 Connection Error:', error);
    logger.error('Please check your AWS credentials, region, and network connectivity');
  }
};

// Run the test
testS3Connection().catch(err => {
  logger.error('Unhandled error in S3 connection test:', err);
});

module.exports = {
  s3,
  s3Config
}; 