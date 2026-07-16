

class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export default ErrorHandler;



export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";
    err.statusCode = err.statusCode || 500;

    // Duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        err = new ErrorHandler(`${field} '${value}' already exists`, 400);
    }

    // Validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");

        err = new ErrorHandler(message, 400);
    }

    // Invalid JWT
    if (err.name === "JsonWebTokenError") {
        err = new ErrorHandler("Invalid JSON Web Token. Please login again.", 401 );
    }

    // Expired JWT
    if (err.name === "TokenExpiredError") {
        err = new ErrorHandler( "Token has expired. Please login again.", 401);
    }

    // Invalid ObjectId
    if (err.name === "CastError") {
        err = new ErrorHandler(`Resource not found. Invalid ${err.path}.`, 400 );
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};