

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ErrorHandler from '../middlewares/error.js';



export const streamDownload = (filePath, res, originalName) => {
    try {
        if (!fs.existsSync(filePath)) {
            throw new ErrorHandler('File not found', 404);
        }

        res.download(filePath, originalName, (err) => {
            if (err) {
                throw new ErrorHandler('Error downloading file', 500);
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
            message: 'Error downloading file',
        });
    }
}



