const { s3, s3Config } = require('./s3Config');

class S3Service {
  /**
   * Generate a folder path for clinic photos
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @returns {string} - The folder path
   */
  getClinicPhotoPath(clinicId, clinicName) {
    // Sanitize clinic name (remove special characters and spaces)
    const sanitizedClinicName = clinicName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `clinic-photos/${clinicId}-${sanitizedClinicName}`;
  }

  /**
   * Upload a clinic photo to S3
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} fileName - The original file name
   * @param {string} contentType - The content type of the file
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  async uploadClinicPhoto(fileBuffer, fileName, contentType, clinicId, clinicName) {
    try {
      // Generate unique file name with timestamp
      const timestamp = new Date().getTime();
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${timestamp}.${fileExtension}`;

      // Generate the full path including the clinic-specific folder
      const folderPath = this.getClinicPhotoPath(clinicId, clinicName);
      const fullPath = `${folderPath}/${uniqueFileName}`;

      const params = {
        Bucket: s3Config.bucket,
        Key: fullPath,
        Body: fileBuffer,
        ContentType: contentType
      };

      console.log('S3 Upload Params:', {
        Bucket: params.Bucket,
        Key: params.Key,
        ContentType: params.ContentType
      });

      const result = await s3.upload(params).promise();
      return {
        url: `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${fullPath}`,
        key: fullPath
      };
    } catch (error) {
      console.error('Error uploading clinic photo to S3:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        stack: error.stack
      });
      throw new Error(`Failed to upload clinic photo to S3: ${error.message}`);
    }
  }

  /**
   * Delete a clinic photo from S3
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @param {string} fileName - The file name to delete
   * @returns {Promise<void>}
   */
  async deleteClinicPhoto(clinicId, clinicName, fileName) {
    try {
      const folderPath = this.getClinicPhotoPath(clinicId, clinicName);
      const fullPath = `${folderPath}/${fileName}`;

      const params = {
        Bucket: s3Config.bucket,
        Key: fullPath
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error('Error deleting clinic photo from S3:', error);
      throw new Error('Failed to delete clinic photo from S3');
    }
  }

  /**
   * List all photos for a specific clinic
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @returns {Promise<Array>} - Array of photo objects with urls and keys
   */
  async listClinicPhotos(clinicId, clinicName) {
    try {
      const folderPath = this.getClinicPhotoPath(clinicId, clinicName);
      
      const params = {
        Bucket: s3Config.bucket,
        Prefix: folderPath + '/'
      };

      const result = await s3.listObjectsV2(params).promise();
      
      return result.Contents.map(item => ({
        key: item.Key,
        url: `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${item.Key}`,
        lastModified: item.LastModified,
        size: item.Size
      }));
    } catch (error) {
      console.error('Error listing clinic photos from S3:', error);
      throw new Error('Failed to list clinic photos from S3');
    }
  }

  /**
   * Get a signed URL for temporary access to a clinic photo
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @param {string} fileName - The file name
   * @param {number} expiryTime - URL expiry time in seconds (default: 1 hour)
   * @returns {Promise<string>} - The signed URL
   */
  async getClinicPhotoSignedUrl(clinicId, clinicName, fileName, expiryTime = 3600) {
    try {
      const folderPath = this.getClinicPhotoPath(clinicId, clinicName);
      const fullPath = `${folderPath}/${fileName}`;

      const params = {
        Bucket: s3Config.bucket,
        Key: fullPath,
        Expires: expiryTime
      };

      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('Error generating signed URL for clinic photo:', error);
      throw new Error('Failed to generate signed URL for clinic photo');
    }
  }
}

module.exports = new S3Service();