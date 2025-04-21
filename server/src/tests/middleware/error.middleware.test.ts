import { Request, Response } from 'express';
import {
    createError,
    routeNotFoundMiddleware,
    errorHandlerMiddleware,
    ApiError
} from '../../middleware/error.middleware';

describe('Error Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
        // Save original NODE_ENV
        originalNodeEnv = process.env.NODE_ENV;

        req = {
            method: 'GET',
            originalUrl: '/test-url'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Mock console.error
        console.error = jest.fn();
    });

    afterEach(() => {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
    });

    describe('createError', () => {
        it('should create an error with the given message and status code', () => {
            const error = createError('Test error', 400);

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
        });
    });

    describe('routeNotFoundMiddleware', () => {
        it('should respond with a 404 status and error message', () => {
            routeNotFoundMiddleware(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: `Route not found: GET /test-url`
            });
        });
    });

    describe('errorHandlerMiddleware', () => {
        it('should handle ApiError with status code', () => {
            // Set NODE_ENV to development for this test
            process.env.NODE_ENV = 'development';
            const error = createError('Bad request', 400);

            errorHandlerMiddleware(error, req as Request, res as Response, next);

            expect(console.error).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(400);

            // Check response structure
            const responseArg = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseArg.success).toBe(false);
            expect(responseArg.error.message).toBe('Bad request');
            expect(responseArg.error.stack).toBeTruthy();
        });

        it('should default to 500 status for regular errors', () => {
            // Set NODE_ENV to development for this test
            process.env.NODE_ENV = 'development';
            const error = new Error('Internal error');

            errorHandlerMiddleware(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(500);

            // Check response structure
            const responseArg = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseArg.success).toBe(false);
            expect(responseArg.error.message).toBe('Internal error');
            expect(responseArg.error.stack).toBeTruthy();
        });

        it('should not include stack trace in production', () => {
            process.env.NODE_ENV = 'production';
            const error = new Error('Production error');

            errorHandlerMiddleware(error, req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: 'Production error'
                }
            });
        });
    });
});
