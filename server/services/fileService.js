import fs from 'fs';
import path from 'path';
import ErrorHandler from '../middlewares/error.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

/**
 * Handle document file upload to Cloudinary (for cloud production storage) or fallback to local disk
 */
export const uploadProjectFile = async (filePath, originalName, mimeType, projectId) => {
    try {
        const uploadResult = await uploadToCloudinary(filePath, `academic_platform/projects/${projectId}`);
        const fileUrl = uploadResult.secure_url || uploadResult.url;

        // Clean up temporary local file after Cloudinary upload
        if (fs.existsSync(filePath) && !fileUrl.startsWith('/uploads/')) {
            fs.unlinkSync(filePath);
        }

        return {
            fileType: mimeType,
            fileUrl,
            originalName,
            uploadedAt: new Date(),
        };
    } catch (err) {
        // Fallback to local path if Cloudinary fails
        const relativeUrl = `/uploads/${filePath.split(/[\\/]/).pop()}`;
        return {
            fileType: mimeType,
            fileUrl: relativeUrl,
            originalName,
            uploadedAt: new Date(),
        };
    }
};

/**
 * Stream or download project deliverable file
 */
export const streamDownload = (filePath, res, originalName) => {
    try {
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            // For Cloudinary or S3 hosted files in production, redirect client directly to secure CDN URL
            return res.redirect(filePath);
        }

        let absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath.replace(/^[/\\]+/, ''));

        if (!fs.existsSync(absolutePath)) {
            // Fallback check directly in uploads directory
            const fallbackPath = path.join(process.cwd(), 'uploads', path.basename(filePath));
            if (fs.existsSync(fallbackPath)) {
                absolutePath = fallbackPath;
            } else {
                throw new ErrorHandler('File not found on server', 404);
            }
        }

        res.download(absolutePath, originalName, (err) => {
            if (err && !res.headersSent) {
                return res.status(500).json({
                    success: false,
                    message: 'Error downloading file',
                });
            }
        });
    } catch (error) {
        if (error instanceof ErrorHandler) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error streaming file download',
        });
    }
};
