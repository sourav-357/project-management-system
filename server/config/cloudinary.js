import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || '1234567890',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'secret',
});

export const uploadToCloudinary = async (filePath, folder = 'academic_platform/avatars') => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'demo') {
            // Local fallback path if Cloudinary env vars are missing
            return {
                public_id: `local_${Date.now()}`,
                url: `/uploads/${filePath.split(/[\\/]/).pop()}`,
                secure_url: `/uploads/${filePath.split(/[\\/]/).pop()}`,
            };
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: 'auto',
        });

        return result;
    } catch (error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

export default cloudinary;
