import { Request, Response, NextFunction } from "express";

/**
 * Interface for API errors with status code and message
 */
export type ApiError = Error & {
    statusCode: number;
};

/**
 * Creates an error with a specific HTTP status code
 */
export const createError = (message: string, statusCode: number): ApiError => {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    return error;
};

/**
 * Route not found middleware
 */
export const routeNotFoundMiddleware = (req: Request, res: Response) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

/**
 * Global error handling middleware
 */
export const errorHandlerMiddleware = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    // Default to 500 if status code is not set
    const statusCode = 'statusCode' in err ? err.statusCode : 500;
    const message = err.message || 'Internal server error';

    return res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};