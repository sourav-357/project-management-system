


import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath;

        if (req.route.path.includes('/upload/:projectId')) {
            uploadPath = path.join(__dirname, '../uploads/projects', req.params.projectId);
        } 
        else if (req.route.path.includes('/upload/:userId')) {
            uploadPath = path.join(__dirname, '../uploads/users', req.params.userId);
        } 
        else {
            uploadPath = path.join(__dirname, '../uploads/temp');
        }

        ensureDirExists(uploadPath);
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});




const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-rar',
        'application/vnd.rar',
        'application/octet-stream',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/javascript',
        'text/css',
        'text/html',
        'application/json',
    ];

    const allwedExtensions = [
        '.pdf',
        '.doc',
        '.docx',
        '.ppt',
        '.pptx',
        '.zip',
        '.rar',
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.txt',
        '.js',
        '.css',
        '.html',
        '.json',
        '.csv',
    ];

    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allwedExtensions.includes(fileExt)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type'), false);
    }
}



const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 10,
        files: 10,
    },
});




const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size exceeds the limit',
            });
        }

        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files uploaded. Maximum 10 fields allowed',
            });
        }

        if (error.message && error.message.includes('Invalid file type')) {
            return res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }
    next(error);
}



export { upload, handleUploadError };


