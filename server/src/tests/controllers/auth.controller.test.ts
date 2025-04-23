import { Request, Response } from 'express';
import { controller as authController } from '../../controllers/auth.controller';
import * as authService from '../../services/auth.service';
import { createError } from '../../middleware/error.middleware';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user.model';

// Mock dependencies
jest.mock('../../services/auth.service');
jest.mock('../../middleware/error.middleware');
jest.mock('jsonwebtoken');
jest.mock('../../models/user.model');

describe('Auth Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Mock jwt.sign
        (jwt.sign as jest.Mock).mockReturnValue('mock-token');
    });

    describe('signup', () => {
        it('should create a new user and return a token', async () => {
            const userData = {
                email: 'new@example.com',
                password: 'password123',
                name: 'New User'
            };

            const userResponse = {
                _id: 'user-id',
                ...userData
            };

            req.body = userData;
            
            // Mock service responses
            (authService.findUserByEmail as jest.Mock).mockResolvedValue(null);
            (authService.createUser as jest.Mock).mockResolvedValue(userResponse);

            await authController.signup(req as Request, res as Response, next);

            expect(authService.findUserByEmail).toHaveBeenCalledWith(userData.email);
            expect(authService.createUser).toHaveBeenCalledWith(userData);
            expect(jwt.sign).toHaveBeenCalledWith({ id: userResponse._id }, expect.any(String), {
                expiresIn: '30d'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-token',
                user: expect.objectContaining({
                    _id: userResponse._id,
                    email: userResponse.email,
                    name: userResponse.name,
                    password: undefined
                })
            });
        });

        it('should return error if email already exists', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Existing User'
            };

            req.body = userData;
            
            // Mock existing user
            (authService.findUserByEmail as jest.Mock).mockResolvedValue({
                _id: 'existing-id',
                email: userData.email
            });
            (createError as jest.Mock).mockReturnValue(new Error('Email exists'));

            await authController.signup(req as Request, res as Response, next);

            expect(authService.findUserByEmail).toHaveBeenCalledWith(userData.email);
            expect(createError).toHaveBeenCalledWith('Email already in use', 409);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(authService.createUser).not.toHaveBeenCalled();
        });

        it('should handle service errors', async () => {
            const userData = {
                email: 'error@example.com',
                password: 'password123',
                name: 'Error User'
            };

            req.body = userData;
            
            const error = new Error('Service error');
            (authService.findUserByEmail as jest.Mock).mockRejectedValue(error);

            await authController.signup(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('login', () => {
        it('should authenticate user and return a token', async () => {
            const loginData = {
                email: 'user@example.com',
                password: 'password123'
            };

            const userResponse = {
                _id: 'user-id',
                email: loginData.email,
                name: 'Test User',
                toObject: jest.fn().mockReturnValue({
                    _id: 'user-id',
                    email: loginData.email,
                    name: 'Test User',
                    password: 'hashed-password'
                }),
                comparePassword: jest.fn().mockResolvedValue(true)
            };

            req.body = loginData;
            
            // Mock user model
            (User.findOne as jest.Mock).mockResolvedValue(userResponse);

            await authController.login(req as Request, res as Response, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
            expect(userResponse.comparePassword).toHaveBeenCalledWith(loginData.password);
            expect(jwt.sign).toHaveBeenCalledWith({ id: userResponse._id }, expect.any(String), {
                expiresIn: '30d'
            });
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-token',
                user: expect.objectContaining({
                    _id: userResponse._id,
                    email: userResponse.email,
                    name: userResponse.name
                })
            });
            // Password should be removed from response
            expect(res.json).not.toHaveBeenCalledWith(
                expect.objectContaining({ password: expect.anything() })
            );
        });

        it('should return error if user not found', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            req.body = loginData;
            
            // Mock non-existent user
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (createError as jest.Mock).mockReturnValue(new Error('Invalid credentials'));

            await authController.login(req as Request, res as Response, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
            expect(createError).toHaveBeenCalledWith('Invalid credentials', 401);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should return error if password is incorrect', async () => {
            const loginData = {
                email: 'user@example.com',
                password: 'wrongpassword'
            };

            const userResponse = {
                _id: 'user-id',
                email: loginData.email,
                name: 'Test User',
                comparePassword: jest.fn().mockResolvedValue(false)
            };

            req.body = loginData;
            
            // Mock incorrect password
            (User.findOne as jest.Mock).mockResolvedValue(userResponse);
            (createError as jest.Mock).mockReturnValue(new Error('Invalid credentials'));

            await authController.login(req as Request, res as Response, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
            expect(userResponse.comparePassword).toHaveBeenCalledWith(loginData.password);
            expect(createError).toHaveBeenCalledWith('Invalid credentials', 401);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle service errors', async () => {
            const loginData = {
                email: 'error@example.com',
                password: 'password123'
            };

            req.body = loginData;
            
            const error = new Error('Service error');
            (User.findOne as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});