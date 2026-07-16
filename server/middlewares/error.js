

// * created cutom errorHandler class for the error messages
class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
export default ErrorHandler;



// * exporting the error handling middleware
export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || 'Internal Server Error';
    err.statusCode = err.statusCode || 500;

    // Duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];

        const message = `${field} '${value}' already exists`;
        err = new ErrorHandler(message, 400);
    }

    if (err.name === 'JsonWebTokenError') {
        const message = 'JSON web token is invalid, Try again';
        err = new ErrorHandler(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'JSON web token is expired, Try again';
        err = new ErrorHandler(message, 401);
    }

    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    const errorMessage = err.errors 
        ? Object.values(err.errors)
            .map((error) => error.message)
            .join(", ") 
        : error.message;


    return res.status(err.statusCode).json({
        success: false,
        message: errorMessage || err.message,
    });
}
