import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware';
import { createError } from '../../middleware/error.middleware';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../middleware/error.middleware');

describe('Auth Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        // Save original env
        originalEnv = process.env;
        process.env.JWT_SECRET = 'test-secret';

        req = {
            headers: {}
        };
        res = {};
        next = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Restore original env
        process.env = originalEnv;
    });

    describe('requireAuth', () => {
        it('should set req.user when token is valid', async () => {
            // Set up a valid Authorization header
            req.headers = {
                authorization: 'Bearer valid-token'
            };

            // Mock successful token verification
            (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-id' });

            await requireAuth(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(req.user).toEqual({ id: 'user-id' });
            expect(next).toHaveBeenCalledWith();
        });

        it('should return 401 when Authorization header is missing', async () => {
            req.headers = {};
            (createError as jest.Mock).mockReturnValue(new Error('Auth required'));

            await requireAuth(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith('Authentication required', 401);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should return 401 when Bearer prefix is missing', async () => {
            req.headers = {
                authorization: 'invalid-format'
            };
            (createError as jest.Mock).mockReturnValue(new Error('Auth required'));

            await requireAuth(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith('Authentication required', 401);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should return 401 when token is missing', async () => {
            req.headers = {
                authorization: 'Bearer '
            };
            (createError as jest.Mock).mockReturnValue(new Error('Auth required'));

            await requireAuth(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith('Authentication required', 401);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should return 401 when token verification fails', async () => {
            req.headers = {
                authorization: 'Bearer invalid-token'
            };

            // Mock token verification failure
            const jwtError = new jwt.JsonWebTokenError('Invalid token');
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw jwtError;
            });
            (createError as jest.Mock).mockReturnValue(new Error('Invalid token'));

            await requireAuth(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
            expect(createError).toHaveBeenCalledWith('Invalid token', 401);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('optionalAuth', () => {
        it('should set req.user when token is valid', async () => {
            // Set up a valid Authorization header
            req.headers = {
                authorization: 'Bearer valid-token'
            };

            // Mock successful token verification
            (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-id' });

            await optionalAuth(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(req.user).toEqual({ id: 'user-id' });
            expect(next).toHaveBeenCalledWith();
        });

        it('should continue without error when Authorization header is missing', async () => {
            req.headers = {};

            await optionalAuth(req as Request, res as Response, next);

            expect(jwt.verify).not.toHaveBeenCalled();
            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalledWith();
        });

        it('should continue without error when Bearer prefix is missing', async () => {
            req.headers = {
                authorization: 'invalid-format'
            };

            await optionalAuth(req as Request, res as Response, next);

            expect(jwt.verify).not.toHaveBeenCalled();
            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalledWith();
        });

        it('should continue without error when token is missing', async () => {
            req.headers = {
                authorization: 'Bearer '
            };

            await optionalAuth(req as Request, res as Response, next);

            expect(jwt.verify).not.toHaveBeenCalled();
            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalledWith();
        });

        it('should continue without error when token verification fails', async () => {
            req.headers = {
                authorization: 'Bearer invalid-token'
            };

            // Mock token verification failure
            const jwtError = new jwt.JsonWebTokenError('Invalid token');
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw jwtError;
            });

            await optionalAuth(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalledWith();
        });
    });
});