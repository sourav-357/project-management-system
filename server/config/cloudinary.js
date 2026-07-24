import { v2 as cloudinary } from 'cloudinary';

/**
 * Streams in-memory file buffer directly to Cloudinary CDN with Data-URI fallback
 */
export const uploadToCloudinary = (fileBuffer, folder = 'academic_platform/misc', resourceType = 'auto', mimeType = 'image/png') => {
  return new Promise((resolve) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isValidKey = apiKey && apiKey !== '1234567890' && apiKey !== 'your_cloudinary_api_key';

    if (cloudName && isValidKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      if (Buffer.isBuffer(fileBuffer)) {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error || !result) {
              console.warn('Cloudinary upload warning:', error?.message || 'Upload failed');
              const base64Str = fileBuffer.toString('base64');
              const dataUri = `data:${mimeType};base64,${base64Str}`;
              return resolve({ secure_url: dataUri, url: dataUri });
            }
            return resolve(result);
          }
        );
        return uploadStream.end(fileBuffer);
      }
    }

    // Direct Data-URI fallback if Cloudinary API key is dummy / not set or fileBuffer is string
    if (Buffer.isBuffer(fileBuffer)) {
      const base64Str = fileBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Str}`;
      return resolve({ secure_url: dataUri, url: dataUri });
    }

    resolve({ secure_url: String(fileBuffer), url: String(fileBuffer) });
  });
};

export default cloudinary;
