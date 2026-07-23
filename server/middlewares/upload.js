import multer from 'multer';
import ErrorHandler from './error.js';

// Memory storage keeps file buffers in memory without writing to local disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ErrorHandler(`Unsupported file format: ${file.mimetype}`, 400), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB file size limit
  fileFilter,
});

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size exceeds 25MB limit' });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
  next();
};