import request from 'supertest';
import app from '../../app';
import { User } from '../../models/user.model';
import jwt from 'jsonwebtoken';

// Mock jwt.sign to return predictable tokens for testing
jest.mock('jsonwebtoken');

describe('Auth Routes', () => {
    beforeEach(async () => {
        // Mock jwt sign to return a predictable token
        (jwt.sign as jest.Mock).mockImplementation((payload) => {
            return `mock-token-for-${payload.id}`;
        });

        // Create a test user for login tests
        await User.create({
            email: 'existing@example.com',
            password: 'password123',
            name: 'Existing User'
        });
    });

    describe('POST /api/v1/auth/signup', () => {
        it('should create a new user and return token', async () => {
            const newUser = {
                email: 'new@example.com',
                password: 'password123',
                name: 'New User'
            };

            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send(newUser)
                .expect(201);

            expect(response.body).toMatchSnapshot();

            // Verify user was created in database
            const user = await User.findOne({ email: newUser.email });
            expect(user).toBeDefined();
            expect(user?.name).toBe(newUser.name);
        });

        it('should return 409 if email already exists', async () => {
            const duplicateUser = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Duplicate User'
            };

            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send(duplicateUser)
                .expect(409);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 400 if required fields are missing', async () => {
            const invalidUser = {
                email: 'invalid@example.com',
                // Missing password and name
            };

            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send(invalidUser)
                .expect(400);

            expect(response.body).toMatchSnapshot();
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should authenticate a user and return token', async () => {
            const loginData = {
                email: 'existing@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 401 for non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 401 for incorrect password', async () => {
            const loginData = {
                email: 'existing@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 400 if required fields are missing', async () => {
            const invalidLogin = {
                // Missing email and password
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(invalidLogin)
                .expect(400);

            expect(response.body).toMatchSnapshot();
        });
    });
});