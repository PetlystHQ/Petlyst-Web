const { s3, s3Config } = require('./s3Config');
const logger = require('../config/logger');

class S3Service {
  /**
   * Generate a folder path for clinic photos
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @param {string} clinicType - The type of the clinic (optional)
   * @returns {string} - The folder path
   */
  getClinicPhotoPath(clinicId, clinicName, clinicType) {
    // ÖNEMLİ: Frontend'den gelen clinicName değeri zaten ID içeriyor olabilir
    // Örnek: "74-sara-hane" şeklinde bir isim gelmiş olabilir
    
    // Frontend'den gelen isim zaten ID içeriyor mu kontrol et
    const hasIdPrefix = clinicName.startsWith(`${clinicId}-`);
    
    // Eğer isim zaten ID ile başlıyorsa, olduğu gibi kullan
    let folderName;
    if (hasIdPrefix) {
      logger.info('Clinic name already contains ID prefix, using as is');
      // Gelen isim zaten ID içeriyor, sanitize et ve kullan
      folderName = clinicName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    } else {
      // Gelen isim ID içermiyor, ekle
      logger.info('Adding ID prefix to clinic name');
      const sanitizedClinicName = clinicName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      folderName = `${clinicId}-${sanitizedClinicName}`;
    }
    
    // Klinik tipini ekle (sadece hiç yoksa)
    if (clinicType && !folderName.includes('veterinary-clinic') && !folderName.includes('animal-hospital')) {
      logger.info('Adding clinic type suffix to folder name');
      const typeSuffix = clinicType.toLowerCase() === 'animal hospital' ? 'animal-hospital' : 'veterinary-clinic';
      folderName = `${folderName}-${typeSuffix}`;
    } else {
      logger.info('Folder name already contains clinic type or no type provided');
    }
    
    logger.info('Final folder path:', `clinic-photos/${folderName}`);
    return `clinic-photos/${folderName}`;
  }

  /**
   * Upload a clinic photo to S3
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} fileName - The original file name
   * @param {string} contentType - The content type of the file
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @param {string} clinicType - The type of the clinic (optional)
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  async uploadClinicPhoto(fileBuffer, fileName, contentType, clinicId, clinicName, clinicType) {
    try {
      logger.info('=========== STARTING S3 UPLOAD PROCESS ===========');
      logger.info('Upload parameters:', { fileName, contentType, clinicId, clinicName, clinicType });
      logger.info('File buffer length:', fileBuffer ? fileBuffer.length : 'undefined');
      logger.info('ENV Check:', {
        accessKeyExists: !!process.env.AWS_ACCESS_KEY_ID,
        secretKeyExists: !!process.env.AWS_SECRET_ACCESS_KEY,
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION
      });
      
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Empty file buffer provided');
      }
      
      if (!fileName) {
        throw new Error('No filename provided');
      }
      
      if (!clinicId || !clinicName) {
        throw new Error('Missing clinic information');
      }
      
      // Generate unique file name with timestamp
      const timestamp = new Date().getTime();
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}.${fileExtension}`;
      logger.info('Generated unique filename:', uniqueFileName);

      // Generate the full path including the clinic-specific folder
      const folderPath = this.getClinicPhotoPath(clinicId, clinicName, clinicType);
      const fullPath = `${folderPath}/${uniqueFileName}`;
      logger.info('IMPORTANT - Full path for S3 object:', fullPath);
      logger.info('Clinic folder path:', folderPath);
      logger.info('Folder structure will be:', {
        bucket: s3Config.bucket,
        mainFolder: 'clinic-photos',
        clinicFolder: this.getClinicPhotoPath(clinicId, clinicName, clinicType).split('clinic-photos/')[1],
        filename: uniqueFileName
      });

      logger.info('Preparing S3 upload with params:', {
        Bucket: s3Config.bucket,
        Key: fullPath,
        ContentType: contentType,
        FileSize: fileBuffer.length
      });

      const params = {
        Bucket: s3Config.bucket,
        Key: fullPath,
        Body: fileBuffer,
        ContentType: contentType
      };

      // Additional logging for params
      logger.info('S3 Upload Params:', {
        Bucket: params.Bucket,
        Key: params.Key,
        ContentType: params.ContentType,
        BodyLength: params.Body.length
      });

      try {
        logger.info('Initiating S3 upload...');
        const result = await s3.upload(params).promise();
        logger.info('S3 upload completed successfully:', {
          ETag: result.ETag,
          Location: result.Location,
          Key: result.Key,
          Bucket: result.Bucket
        });
        
        // Her durumda elle URL oluşturalım, Location'a güvenmeyelim
        const manualUrl = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${fullPath}`;
        logger.info('Manually constructed URL:', manualUrl);
        logger.info('S3 returned Location:', result.Location || 'No Location returned');
        
        // Farklılık varsa uyarı gösterelim
        if (result.Location && result.Location !== manualUrl) {
          logger.warn('Warning: S3 Location differs from manually constructed URL');
          logger.warn(`S3 Location: ${result.Location}`);
          logger.warn(`Manual URL: ${manualUrl}`);
        }
        
        return {
          url: manualUrl, // Her zaman manuel URL'yi kullan
          key: fullPath,
          s3Location: result.Location // Debugging için ek bilgi
        };
      } catch (uploadError) {
        logger.error('Direct S3 upload error:', {
          message: uploadError.message,
          code: uploadError.code,
          region: s3Config.region,
          bucket: s3Config.bucket
        });
        throw uploadError;
      }
    } catch (error) {
      logger.error('Error uploading clinic photo to S3:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        stack: error.stack
      });
      throw new Error(`Failed to upload clinic photo to S3: ${error.message}`, { cause: error });
    }
  }

  // const deleteFileFromS3 = async (clinic_id, clinic_name, key) => {
  //   try {
  
  //     // Create the delete parameters
  //     const params = {
  //       Bucket: 'petlyst-s3', // Your S3 bucket name
  //       Key: key
  //     };
  
  //     // Create the delete object command
  //     const command = new DeleteObjectCommand(params);
  
  //     // Execute the delete command
  //     const result = await s3.send(command);
  
  //     return result; // Return the result for further processing if needed
  //   } catch (error) {
  //     logger.error('Error deleting file from S3:', error);
  //     throw error; // Rethrow the error to be handled by the calling function
  //   }
  // };

  /**
   * Delete a clinic photo from S3
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @param {string} fileName - The file name to delete
   * @param {string} key - The key of the file to delete
   * @returns {Promise<void>}
   */
  async deleteClinicPhoto(key) {
    try {

      const params = {
        Bucket: s3Config.bucket,
        Key: key
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      logger.error('Error deleting clinic photo from S3:', error);
      throw new Error('Failed to delete clinic photo from S3', { cause: error });
    }
  }

  /**
   * List all photos for a specific clinic
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @param {string} clinicType - The type of the clinic (optional)
   * @returns {Promise<Array>} - Array of photo objects with urls and keys
   */
  async listClinicPhotos(clinicId, clinicName, clinicType) {
    const folderPath = this.getClinicPhotoPath(clinicId, clinicName, clinicType);
    const params = {
      Bucket: s3Config.bucket,
      Prefix: folderPath + '/'
    };

    try {
      const result = await s3.listObjectsV2(params).promise();
      
      if (!result.Contents || result.Contents.length === 0) {
        return [];
      }

      // Generate pre-signed URLs for each photo
      const photos = await Promise.all(result.Contents.map(async item => {
        const signedUrl = await s3.getSignedUrlPromise('getObject', {
          Bucket: s3Config.bucket,
          Key: item.Key,
          Expires: 3600 // URL expires in 1 hour
        });

        return {
          key: item.Key,
          url: signedUrl,
          lastModified: item.LastModified,
          size: item.Size
        };
      }));

      return photos;
    } catch (error) {
      logger.error('Error listing clinic photos from S3:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        stack: error.stack,
        bucket: s3Config.bucket,
        region: s3Config.region,
        folderPath: params.Prefix
      });
      throw new Error(`Failed to list clinic photos from S3: ${error.message}`, { cause: error });
    }
  }

  /**
   * Get a signed URL for temporary access to a clinic photo
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @param {string} fileName - The file name
   * @param {number} expiryTime - URL expiry time in seconds (default: 1 hour)
   * @param {string} clinicType - The type of the clinic (optional)
   * @returns {Promise<string>} - The signed URL
   */
  async getClinicPhotoSignedUrl(clinicId, clinicName, fileName, expiryTime = 3600, clinicType) {
    try {
      const folderPath = this.getClinicPhotoPath(clinicId, clinicName, clinicType);
      const fullPath = `${folderPath}/${fileName}`;

      const params = {
        Bucket: s3Config.bucket,
        Key: fullPath,
        Expires: expiryTime
      };

      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      logger.error('Error generating signed URL for clinic photo:', error);
      throw new Error('Failed to generate signed URL for clinic photo', { cause: error });
    }
  }

  /**
   * Delete all photos for a clinic from S3
   * @param {string} clinicId - The ID of the clinic
   * @param {string} clinicName - The name of the clinic
   * @returns {Promise<{deleted: number}>} - Number of files deleted
   */
  async deleteClinicFolder(clinicId, clinicName) {
    try {
      logger.info(`=== S3 FOLDER DELETION STARTED ===`);
      logger.info(`Attempting to delete all photos for clinic: ${clinicId}, ${clinicName}`);
      
      // First, list all objects in the clinic's folder
      const folderPath = this.getClinicPhotoPath(clinicId, clinicName);
      logger.info('S3 folder path:', folderPath);
      
      // Verify the sanitized clinic name matches what we expect
      const sanitizedClinicName = clinicName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      logger.info('Sanitized clinic name check:', {
        original: clinicName,
        sanitized: sanitizedClinicName,
        expected: `clinic-photos/${clinicId}-${sanitizedClinicName}`
      });
      
      const listParams = {
        Bucket: s3Config.bucket,
        Prefix: folderPath + '/'
      };
      
      logger.info('S3 ListObjectsV2 params:', {
        Bucket: listParams.Bucket,
        Prefix: listParams.Prefix
      });
      
      // Log the AWS configuration being used
      logger.info('S3 Configuration Check:', {
        region: s3Config.region,
        bucket: s3Config.bucket,
        accessKeyExists: !!s3Config.accessKeyId,
        secretKeyExists: !!s3Config.secretAccessKey
      });
      
      logger.info('Listing objects with prefix:', folderPath + '/');
      
      const listedObjects = await s3.listObjectsV2(listParams).promise();
      
      logger.info('S3 ListObjectsV2 response:', {
        keyCount: listedObjects.KeyCount,
        contentsLength: listedObjects.Contents ? listedObjects.Contents.length : 0,
        isTruncated: listedObjects.IsTruncated
      });
      
      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        logger.info(`No objects found in clinic folder: ${folderPath}`);
        return { deleted: 0 };
      }
      
      // Log the first few objects for verification
      const previewObjects = listedObjects.Contents.slice(0, Math.min(5, listedObjects.Contents.length));
      logger.info('Preview of objects to delete:', previewObjects.map(obj => ({ Key: obj.Key, Size: obj.Size, LastModified: obj.LastModified })));
      
      logger.info(`Found ${listedObjects.Contents.length} objects to delete in clinic folder`);
      
      // Create an array of objects to delete
      const deleteParams = {
        Bucket: s3Config.bucket,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
          Quiet: false
        }
      };
      
      logger.info(`Sending DeleteObjects request for ${deleteParams.Delete.Objects.length} objects`);
      
      // Delete all the objects in a single batch
      const deleteResult = await s3.deleteObjects(deleteParams).promise();
      
      logger.info('S3 DeleteObjects response:', {
        deletedCount: deleteResult.Deleted ? deleteResult.Deleted.length : 0,
        errorsCount: deleteResult.Errors ? deleteResult.Errors.length : 0
      });
      
      // Log any errors
      if (deleteResult.Errors && deleteResult.Errors.length > 0) {
        logger.error('Errors occurred during batch deletion:', deleteResult.Errors);
      }
      
      logger.info(`Successfully deleted ${deleteResult.Deleted ? deleteResult.Deleted.length : 0} objects from S3`);
      
      // Check if we need to continue due to S3 listing limit (1000 objects)
      if (listedObjects.IsTruncated) {
        logger.info('Object listing was truncated, continuing deletion');
        const nextBatchResult = await this.deleteClinicFolder(clinicId, clinicName);
        return { 
          deleted: (deleteResult.Deleted ? deleteResult.Deleted.length : 0) + nextBatchResult.deleted 
        };
      }
      
      logger.info(`=== S3 FOLDER DELETION COMPLETED ===`);
      return { deleted: deleteResult.Deleted ? deleteResult.Deleted.length : 0 };
    } catch (error) {
      logger.error('=== S3 FOLDER DELETION ERROR ===');
      logger.error('Error deleting clinic folder from S3:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        stack: error.stack,
        bucket: s3Config.bucket,
        region: s3Config.region,
        clinicId,
        clinicName
      });
      throw new Error(`Failed to delete clinic folder from S3: ${error.message}`, { cause: error });
    }
  }

  /**
   * Test S3 upload functionality with a simple text file
   * @returns {Promise<boolean>} - Whether the test was successful
   */
  async testS3Upload() {
    try {
      logger.info('=========== TESTING S3 UPLOAD FUNCTIONALITY ===========');
      
      // Create a simple test file content
      const testContent = Buffer.from('This is a test file to verify S3 upload functionality ' + new Date().toISOString());
      const testKey = `test-uploads/test-file-${Date.now()}.txt`;
      
      logger.info(`Attempting to upload test file with key: ${testKey}`);
      
      const params = {
        Bucket: s3Config.bucket,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      };
      
      const result = await s3.upload(params).promise();
      
      logger.info('Test upload successful:', {
        Location: result.Location,
        Key: result.Key,
        Bucket: result.Bucket
      });
      
      logger.info(`Test file should be accessible at: ${result.Location}`);
      
      return {
        success: true,
        url: result.Location,
        key: result.Key
      };
    } catch (error) {
      logger.error('S3 test upload failed:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        region: s3Config.region,
        bucket: s3Config.bucket
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a folder path for veterinarian photos
   * @param {string} veterinarianId - The ID of the veterinarian
   * @param {string} veterinarianName - The name of the veterinarian
   * @returns {string} - The folder path
   */
  getVeterinarianPhotoPath(veterinarianId, veterinarianName) {
    // Sanitize veterinarian name
    const sanitizedVeterinarianName = veterinarianName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const folderName = `${veterinarianId}-${sanitizedVeterinarianName}`;
    
    logger.info('Final veterinarian folder path:', `veterinarian-photos/${folderName}`);
    return `veterinarian-photos/${folderName}`;
  }

  /**
   * Upload a veterinarian photo to S3
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} fileName - The original file name
   * @param {string} contentType - The content type of the file
   * @param {string} veterinarianId - The ID of the veterinarian
   * @param {string} veterinarianName - The name of the veterinarian
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  async uploadVeterinarianPhoto(fileBuffer, fileName, contentType, veterinarianId, veterinarianName) {
    try {
      logger.info('=========== STARTING VETERINARIAN PHOTO S3 UPLOAD PROCESS ===========');
      logger.info('Upload parameters:', { fileName, contentType, veterinarianId, veterinarianName });
      logger.info('File buffer length:', fileBuffer ? fileBuffer.length : 'undefined');
      logger.info('ENV Check:', {
        accessKeyExists: !!process.env.AWS_ACCESS_KEY_ID,
        secretKeyExists: !!process.env.AWS_SECRET_ACCESS_KEY,
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION
      });
      
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Empty file buffer provided');
      }
      
      if (!fileName) {
        throw new Error('No filename provided');
      }
      
      if (!veterinarianId || !veterinarianName) {
        throw new Error('Missing veterinarian information');
      }
      
      // Generate unique file name with timestamp
      const timestamp = new Date().getTime();
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}.${fileExtension}`;
      logger.info('Generated unique filename:', uniqueFileName);

      // Generate the full path including the veterinarian-specific folder
      const folderPath = this.getVeterinarianPhotoPath(veterinarianId, veterinarianName);
      const fullPath = `${folderPath}/${uniqueFileName}`;
      logger.info('IMPORTANT - Full path for S3 object:', fullPath);
      logger.info('Veterinarian folder path:', folderPath);
      logger.info('Folder structure will be:', {
        bucket: s3Config.bucket,
        mainFolder: 'veterinarian-photos',
        veterinarianFolder: this.getVeterinarianPhotoPath(veterinarianId, veterinarianName).split('veterinarian-photos/')[1],
        filename: uniqueFileName
      });

      logger.info('Preparing S3 upload with params:', {
        Bucket: s3Config.bucket,
        Key: fullPath,
        ContentType: contentType,
        FileSize: fileBuffer.length
      });

      const params = {
        Bucket: s3Config.bucket,
        Key: fullPath,
        Body: fileBuffer,
        ContentType: contentType
      };

      try {
        logger.info('Initiating S3 upload...');
        const result = await s3.upload(params).promise();
        logger.info('S3 upload completed successfully:', {
          ETag: result.ETag,
          Location: result.Location,
          Key: result.Key,
          Bucket: result.Bucket
        });
        
        // Her durumda elle URL oluşturalım, Location'a güvenmeyelim
        const manualUrl = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${fullPath}`;
        logger.info('Manually constructed URL:', manualUrl);
        logger.info('S3 returned Location:', result.Location || 'No Location returned');
        
        // Farklılık varsa uyarı gösterelim
        if (result.Location && result.Location !== manualUrl) {
          logger.warn('Warning: S3 Location differs from manually constructed URL');
          logger.warn(`S3 Location: ${result.Location}`);
          logger.warn(`Manual URL: ${manualUrl}`);
        }
        
        return {
          url: manualUrl, // Her zaman manuel URL'yi kullan
          key: fullPath,
          s3Location: result.Location // Debugging için ek bilgi
        };
      } catch (uploadError) {
        logger.error('Direct S3 upload error:', {
          message: uploadError.message,
          code: uploadError.code,
          region: s3Config.region,
          bucket: s3Config.bucket
        });
        throw uploadError;
      }
    } catch (error) {
      logger.error('Error uploading veterinarian photo to S3:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        stack: error.stack
      });
      throw new Error(`Failed to upload veterinarian photo to S3: ${error.message}`, { cause: error });
    }
  }

  /**
   * Delete a veterinarian photo from S3
   * @param {string} key - The key of the file to delete
   * @returns {Promise<void>}
   */
  async deleteVeterinarianPhoto(key) {
    try {
      const params = {
        Bucket: s3Config.bucket,
        Key: key
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      logger.error('Error deleting veterinarian photo from S3:', error);
      throw new Error('Failed to delete veterinarian photo from S3', { cause: error });
    }
  }

  /**
   * Delete all photos for a specific veterinarian
   * @param {string} veterinarianId - The ID of the veterinarian
   * @param {string} veterinarianName - The name of the veterinarian
   * @returns {Promise<void>}
   */
  async deleteVeterinarianFolder(veterinarianId, veterinarianName) {
    try {
      logger.info(`Starting deletion of veterinarian folder for veterinarian ID: ${veterinarianId}`);
      const folderPath = this.getVeterinarianPhotoPath(veterinarianId, veterinarianName);
      
      // First, list all objects in the folder
      const listParams = {
        Bucket: s3Config.bucket,
        Prefix: folderPath + '/'
      };

      logger.info('Listing objects with params:', listParams);
      const listedObjects = await s3.listObjectsV2(listParams).promise();
      
      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        logger.info(`Found ${listedObjects.Contents.length} objects to delete`);
        
        // Create an array of objects to delete in a single operation
        const deleteParams = {
          Bucket: s3Config.bucket,
          Delete: {
            Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key })),
            Quiet: false
          }
        };
        
        logger.info(`Deleting ${deleteParams.Delete.Objects.length} objects in folder ${folderPath}`);
        const deleteResult = await s3.deleteObjects(deleteParams).promise();
        logger.info('Delete operation completed:', deleteResult);
        
        // Check if the deletion was successful
        if (deleteResult.Deleted) {
          logger.info(`Successfully deleted ${deleteResult.Deleted.length} objects`);
        }
        
        if (deleteResult.Errors && deleteResult.Errors.length > 0) {
          logger.error('Error deleting some objects:', deleteResult.Errors);
          throw new Error(`Failed to delete some veterinarian photos: ${deleteResult.Errors.length} errors occurred`);
        }
        
        return {
          success: true,
          deletedCount: deleteResult.Deleted ? deleteResult.Deleted.length : 0,
          errors: deleteResult.Errors || []
        };
      } else {
        logger.info(`No objects found in folder ${folderPath}`);
        return {
          success: true,
          deletedCount: 0,
          message: "No objects found to delete"
        };
      }
    } catch (error) {
      logger.error('Error deleting veterinarian folder:', error);
      throw new Error(`Failed to delete veterinarian folder: ${error.message}`, { cause: error });
    }
  }

  /**
   * Generate a folder path for pet photos
   * @param {string} petOwnerId - The ID of the pet owner
   * @param {string} petName - The name of the pet
   * @returns {string} - The folder path
   */
  getPetPhotoPath(petOwnerId, petName) {
    // Create folder path in the specified format: pet-photos/petowner-{id}/{pet_name}
    const ownerFolder = `petowner-${petOwnerId}`;
    
    // Sanitize pet name to be used in URL path
    const sanitizedPetName = petName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    logger.info('Final pet photo path:', `pet-photos/${ownerFolder}/${sanitizedPetName}`);
    return `pet-photos/${ownerFolder}/${sanitizedPetName}`;
  }

  /**
   * Upload a pet photo to S3
   * @param {object} file - The file object containing buffer, mimetype, and original name
   * @param {string} petOwnerId - The ID of the pet owner
   * @param {string} petName - The name of the pet
   * @returns {Promise<object>} - Object containing the URL and key of the uploaded file
   */
  async uploadPetPhoto(file, petOwnerId, petName) {
    try {
      logger.info('=========== STARTING PET PHOTO S3 UPLOAD PROCESS ===========');
      logger.info('Upload parameters:', { 
        fileName: file.originalname, 
        contentType: file.mimetype, 
        petOwnerId, 
        petName 
      });
      logger.info('File buffer length:', file.buffer ? file.buffer.length : 'undefined');
      
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('Empty file buffer provided');
      }
      
      if (!file.originalname) {
        throw new Error('No filename provided');
      }
      
      if (!petOwnerId || !petName) {
        throw new Error('Missing pet or owner information');
      }
      
      // Get the file extension
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      
      // Generate the path for the pet photo
      const folderPath = this.getPetPhotoPath(petOwnerId, petName);
      
      // For pet photos, we'll use the pet name directly with file extension
      const uniqueFileName = `${petName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;
      const fullPath = `${folderPath}.${fileExtension}`;
      
      logger.info('IMPORTANT - Full path for S3 object:', fullPath);
      logger.info('Folder structure:', {
        bucket: s3Config.bucket,
        mainFolder: 'pet-photos',
        ownerFolder: `petowner-${petOwnerId}`,
        filename: uniqueFileName
      });

      const params = {
        Bucket: s3Config.bucket,
        Key: fullPath,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      try {
        logger.info('Initiating S3 upload...');
        const result = await s3.upload(params).promise();
        logger.info('S3 upload completed successfully:', {
          ETag: result.ETag,
          Location: result.Location,
          Key: result.Key,
          Bucket: result.Bucket
        });
        
        // Manually construct URL for consistency
        const manualUrl = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${fullPath}`;
        logger.info('Manually constructed URL:', manualUrl);
        
        return {
          url: manualUrl,
          key: fullPath,
          s3Location: result.Location // For debugging
        };
      } catch (uploadError) {
        logger.error('S3 upload error:', {
          message: uploadError.message,
          code: uploadError.code,
          region: s3Config.region,
          bucket: s3Config.bucket
        });
        throw uploadError;
      }
    } catch (error) {
      logger.error('Error uploading pet photo to S3:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        stack: error.stack
      });
      throw new Error(`Failed to upload pet photo to S3: ${error.message}`, { cause: error });
    }
  }

  /**
   * Delete a pet photo from S3
   * @param {string} key - The key of the file to delete
   * @returns {Promise<void>}
   */
  async deletePetPhoto(key) {
    try {
      const params = {
        Bucket: s3Config.bucket,
        Key: key
      };

      await s3.deleteObject(params).promise();
      logger.info(`Successfully deleted pet photo with key: ${key}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting pet photo from S3:', error);
      throw new Error('Failed to delete pet photo from S3', { cause: error });
    }
  }

  /**
   * Delete all photos for a specific pet owner
   * @param {string} petOwnerId - The ID of the pet owner
   * @returns {Promise<object>} - Result of the deletion operation
   */
  async deletePetOwnerPhotos(petOwnerId) {
    try {
      logger.info(`Starting deletion of all photos for pet owner ID: ${petOwnerId}`);
      const folderPath = `pet-photos/petowner-${petOwnerId}`;
      
      // List all objects in the folder
      const listParams = {
        Bucket: s3Config.bucket,
        Prefix: folderPath + '/'
      };

      logger.info('Listing objects with params:', listParams);
      const listedObjects = await s3.listObjectsV2(listParams).promise();
      
      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        logger.info(`Found ${listedObjects.Contents.length} objects to delete`);
        
        // Delete all objects in a single operation
        const deleteParams = {
          Bucket: s3Config.bucket,
          Delete: {
            Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key })),
            Quiet: false
          }
        };
        
        logger.info(`Deleting ${deleteParams.Delete.Objects.length} objects in folder ${folderPath}`);
        const deleteResult = await s3.deleteObjects(deleteParams).promise();
        
        if (deleteResult.Errors && deleteResult.Errors.length > 0) {
          logger.error('Error deleting some objects:', deleteResult.Errors);
          throw new Error(`Failed to delete some pet photos: ${deleteResult.Errors.length} errors occurred`);
        }
        
        return {
          success: true,
          deletedCount: deleteResult.Deleted ? deleteResult.Deleted.length : 0
        };
      } else {
        logger.info(`No objects found in folder ${folderPath}`);
        return {
          success: true,
          deletedCount: 0,
          message: "No objects found to delete"
        };
      }
    } catch (error) {
      logger.error('Error deleting pet owner photos:', error);
      throw new Error(`Failed to delete pet owner photos: ${error.message}`, { cause: error });
    }
  }

  /**
   * Generate a folder path for pet owner profile photos
   * @param {string} petOwnerId - The ID of the pet owner
   * @param {string} userName - The name of the user
   * @returns {string} - The folder path
   */
  getPetOwnerProfilePhotoPath(petOwnerId, userName) {
    // Create folder path in the specified format: pet-owner-photos/petowner-{id}
    const ownerFolder = `petowner-${petOwnerId}`;
    
    // Sanitize user name to be used in URL path
    const sanitizedUserName = userName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    logger.info('Final pet owner profile photo path:', `pet-owner-photos/${ownerFolder}/${sanitizedUserName}`);
    return `pet-owner-photos/${ownerFolder}/${sanitizedUserName}`;
  }

  /**
   * Upload a pet owner profile photo to S3
   * @param {object} file - The file object containing buffer, mimetype, and originalname
   * @param {string} petOwnerId - The ID of the pet owner
   * @param {string} userName - The name of the user
   * @returns {Promise<object>} - Object containing the URL and key of the uploaded file
   */
  async uploadPetOwnerProfilePhoto(file, petOwnerId, userName) {
    try {
      logger.info('=========== STARTING PET OWNER PROFILE PHOTO S3 UPLOAD PROCESS ===========');
      logger.info('Upload parameters:', { 
        fileName: file.originalname, 
        contentType: file.mimetype, 
        petOwnerId, 
        userName 
      });
      logger.info('File buffer length:', file.buffer ? file.buffer.length : 'undefined');
      
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('Empty file buffer provided');
      }
      
      if (!file.originalname) {
        throw new Error('No filename provided');
      }
      
      if (!petOwnerId || !userName) {
        throw new Error('Missing pet owner information');
      }
      
      // Get the file extension
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      
      // Generate the path for the pet owner profile photo
      const folderPath = this.getPetOwnerProfilePhotoPath(petOwnerId, userName);
      
      // Generate unique filename using timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const uniqueFileName = `${userName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.${fileExtension}`;
      const fullPath = `${folderPath.split('/').slice(0, 2).join('/')}/${uniqueFileName}`;
      
      logger.info('IMPORTANT - Full path for S3 object:', fullPath);
      logger.info('Folder structure:', {
        bucket: s3Config.bucket,
        mainFolder: 'pet-owner-photos',
        ownerFolder: `petowner-${petOwnerId}`,
        filename: uniqueFileName
      });

      const params = {
        Bucket: s3Config.bucket,
        Key: fullPath,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      try {
        logger.info('Initiating S3 upload...');
        const result = await s3.upload(params).promise();
        logger.info('S3 upload completed successfully:', {
          ETag: result.ETag,
          Location: result.Location,
          Key: result.Key,
          Bucket: result.Bucket
        });
        
        // Manually construct URL for consistency
        const manualUrl = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${fullPath}`;
        logger.info('Manually constructed URL:', manualUrl);
        
        return {
          url: manualUrl,
          key: fullPath,
          s3Location: result.Location // For debugging
        };
      } catch (uploadError) {
        logger.error('S3 upload error:', {
          message: uploadError.message,
          code: uploadError.code,
          region: s3Config.region,
          bucket: s3Config.bucket
        });
        throw uploadError;
      }
    } catch (error) {
      logger.error('Error uploading pet owner profile photo to S3:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        stack: error.stack
      });
      throw new Error(`Failed to upload pet owner profile photo to S3: ${error.message}`, { cause: error });
    }
  }

  /**
   * Delete a pet owner profile photo from S3
   * @param {string} key - The key of the file to delete
   * @returns {Promise<void>}
   */
  async deletePetOwnerProfilePhoto(key) {
    try {
      const params = {
        Bucket: s3Config.bucket,
        Key: key
      };

      await s3.deleteObject(params).promise();
      logger.info(`Successfully deleted pet owner profile photo with key: ${key}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting pet owner profile photo from S3:', error);
      throw new Error('Failed to delete pet owner profile photo from S3', { cause: error });
    }
  }

  /**
   * Delete all profile photos for a specific pet owner
   * @param {string} petOwnerId - The ID of the pet owner
   * @returns {Promise<object>} - Result of the deletion operation
   */
  async deletePetOwnerProfileFolder(petOwnerId) {
    try {
      logger.info(`Starting deletion of all profile photos for pet owner ID: ${petOwnerId}`);
      const folderPath = `pet-owner-photos/petowner-${petOwnerId}`;
      
      // List all objects in the folder
      const listParams = {
        Bucket: s3Config.bucket,
        Prefix: folderPath + '/'
      };

      logger.info('Listing objects with params:', listParams);
      const listedObjects = await s3.listObjectsV2(listParams).promise();
      
      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        logger.info(`Found ${listedObjects.Contents.length} objects to delete in profile folder`);
        
        // Log the objects found for debugging
        listedObjects.Contents.forEach(obj => {
          logger.info(`Found object in profile folder: ${obj.Key}`);
        });
        
        // Delete all objects in a single operation
        const deleteParams = {
          Bucket: s3Config.bucket,
          Delete: {
            Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key })),
            Quiet: false
          }
        };
        
        logger.info(`Deleting ${deleteParams.Delete.Objects.length} objects in folder ${folderPath}`);
        const deleteResult = await s3.deleteObjects(deleteParams).promise();
        
        if (deleteResult.Errors && deleteResult.Errors.length > 0) {
          logger.error('Error deleting some profile objects:', deleteResult.Errors);
          throw new Error(`Failed to delete some profile photos: ${deleteResult.Errors.length} errors occurred`);
        }
        
        logger.info(`Successfully deleted ${deleteResult.Deleted.length} profile photos from S3`);
        return {
          success: true,
          deletedCount: deleteResult.Deleted ? deleteResult.Deleted.length : 0
        };
      } else {
        logger.info(`No objects found in profile folder ${folderPath}`);
        return {
          success: true,
          deletedCount: 0,
          message: "No profile photos found to delete"
        };
      }
    } catch (error) {
      logger.error('Error deleting pet owner profile folder:', error);
      throw new Error(`Failed to delete pet owner profile folder: ${error.message}`, { cause: error });
    }
  }
}

// Export both the class and an instance
module.exports = S3Service;
// Create and export an instance for direct method access
const s3ServiceInstance = new S3Service();
module.exports.deleteClinicPhoto = s3ServiceInstance.deleteClinicPhoto.bind(s3ServiceInstance);
module.exports.uploadClinicPhoto = s3ServiceInstance.uploadClinicPhoto.bind(s3ServiceInstance);
module.exports.listClinicPhotos = s3ServiceInstance.listClinicPhotos.bind(s3ServiceInstance);
module.exports.getClinicPhotoSignedUrl = s3ServiceInstance.getClinicPhotoSignedUrl.bind(s3ServiceInstance);
module.exports.getClinicPhotoPath = s3ServiceInstance.getClinicPhotoPath.bind(s3ServiceInstance);
module.exports.deleteClinicFolder = s3ServiceInstance.deleteClinicFolder.bind(s3ServiceInstance);
module.exports.testS3Upload = s3ServiceInstance.testS3Upload ? s3ServiceInstance.testS3Upload.bind(s3ServiceInstance) : undefined;
module.exports.getVeterinarianPhotoPath = s3ServiceInstance.getVeterinarianPhotoPath.bind(s3ServiceInstance);
module.exports.uploadVeterinarianPhoto = s3ServiceInstance.uploadVeterinarianPhoto.bind(s3ServiceInstance);
module.exports.deleteVeterinarianPhoto = s3ServiceInstance.deleteVeterinarianPhoto.bind(s3ServiceInstance);
module.exports.deleteVeterinarianFolder = s3ServiceInstance.deleteVeterinarianFolder.bind(s3ServiceInstance);
module.exports.getPetPhotoPath = s3ServiceInstance.getPetPhotoPath.bind(s3ServiceInstance);
module.exports.uploadPetPhoto = s3ServiceInstance.uploadPetPhoto.bind(s3ServiceInstance);
module.exports.deletePetPhoto = s3ServiceInstance.deletePetPhoto.bind(s3ServiceInstance);
module.exports.deletePetOwnerPhotos = s3ServiceInstance.deletePetOwnerPhotos.bind(s3ServiceInstance);
module.exports.getPetOwnerProfilePhotoPath = s3ServiceInstance.getPetOwnerProfilePhotoPath.bind(s3ServiceInstance);
module.exports.uploadPetOwnerProfilePhoto = s3ServiceInstance.uploadPetOwnerProfilePhoto.bind(s3ServiceInstance);
module.exports.deletePetOwnerProfilePhoto = s3ServiceInstance.deletePetOwnerProfilePhoto.bind(s3ServiceInstance);
module.exports.deletePetOwnerProfileFolder = s3ServiceInstance.deletePetOwnerProfileFolder.bind(s3ServiceInstance);