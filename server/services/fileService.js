import ErrorHandler from '../middlewares/error.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

/**
 * Handle document file upload directly to Cloudinary or base64 fallback from memory buffer
 */
export const uploadProjectFile = async (fileBuffer, originalName, mimeType, projectId) => {
  try {
    const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';
    const uploadResult = await uploadToCloudinary(fileBuffer, `academic_platform/projects/${projectId}`, resourceType, mimeType);
    const fileUrl = uploadResult.secure_url || uploadResult.url;

    return {
      fileType: mimeType,
      fileUrl,
      originalName,
      uploadedAt: new Date(),
    };
  } catch (err) {
    throw new ErrorHandler(`File upload failed: ${err.message}`, 500);
  }
};

/**
 * Stream or download project deliverable file
 */
export const streamDownload = (filePath, res) => {
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return res.redirect(filePath);
  }
  return res.status(404).json({
    success: false,
    message: 'File not found on cloud storage',
  });
};
