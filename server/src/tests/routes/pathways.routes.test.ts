import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { Pathway } from '../../models/pathway.model';
import { User } from '../../models/user.model';
import jwt from 'jsonwebtoken';

describe('Pathway Routes', () => {
    let pathwayId: string;
    let userId: string;
    let anotherUserId: string;
    let userToken: string;
    let anotherUserToken: string;

    beforeEach(async () => {
        // Create test users
        const user = await User.create({
            email: 'user@example.com',
            password: 'password123',
            name: 'Test User'
        });
        userId = user._id.toString();
        userToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');

        const anotherUser = await User.create({
            email: 'another@example.com',
            password: 'password123',
            name: 'Another User'
        });
        anotherUserId = anotherUser._id.toString();
        anotherUserToken = jwt.sign({ id: anotherUserId }, process.env.JWT_SECRET || 'test-secret');

        // Create a test pathway owned by user
        const pathway = await Pathway.create({
            name: 'Test Pathway',
            description: 'Test Description',
            owner: user._id
        });
        pathwayId = pathway._id.toString();

        // Create additional pathways for pagination tests
        const pathways = [];
        for (let i = 1; i <= 15; i++) {
            pathways.push({
                name: `Pathway ${i}`,
                description: `Description ${i}`,
                owner: i % 2 === 0 ? user._id : anotherUser._id
            });
        }
        await Pathway.insertMany(pathways);
    });

    describe('GET /api/v1/pathways', () => {
        it('should get all pathways with default pagination without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/pathways')
                .expect(200);

            expect(response.body).toMatchSnapshot();
        });

        it('should get all pathways with default pagination with authentication', async () => {
            const response = await request(app)
                .get('/api/v1/pathways')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toMatchSnapshot();
        });

        it('should get pathways with custom pagination', async () => {
            const response = await request(app)
                .get('/api/v1/pathways?page=2&limit=5')
                .expect(200);

            expect(response.body).toMatchSnapshot();
        });
    });

    describe('GET /api/v1/pathways/:id', () => {
        it('should get a pathway by id without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/pathways/${pathwayId}`)
                .expect(200);

            expect(response.body).toMatchSnapshot();
        });

        it('should get a pathway by id with authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/pathways/${pathwayId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 404 for non-existent pathway', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .get(`/api/v1/pathways/${nonExistentId}`)
                .expect(404);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 400 for invalid id format', async () => {
            const response = await request(app)
                .get('/api/v1/pathways/invalid-id')
                .expect(400);

            expect(response.body).toMatchSnapshot();
        });
    });

    describe('POST /api/v1/pathways', () => {
        it('should create a new pathway when authenticated', async () => {
            const newPathway = {
                name: 'New Pathway',
                description: 'New Description'
            };

            const response = await request(app)
                .post('/api/v1/pathways')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ pathway: newPathway })
                .expect(201);

            expect(response.body).toMatchSnapshot();

            // Verify it was created in the database
            const savedPathway = await Pathway.findById(response.body.pathway._id);
            expect(savedPathway).toBeDefined();
            expect(savedPathway?.name).toBe(newPathway.name);
        });

        it('should return 401 when not authenticated', async () => {
            const newPathway = {
                name: 'New Pathway',
                description: 'New Description'
            };

            const response = await request(app)
                .post('/api/v1/pathways')
                .send({ pathway: newPathway })
                .expect(401);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/v1/pathways')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ pathway: { name: 'Missing Description' } })
                .expect(400);

            expect(response.body).toMatchSnapshot();
        });
    });

    describe('PATCH /api/v1/pathways/:id', () => {
        it('should update pathway when owner is authenticated', async () => {
            const updateData = {
                name: 'Updated Pathway',
                description: 'Updated Description'
            };

            const response = await request(app)
                .patch(`/api/v1/pathways/${pathwayId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ pathway: updateData })
                .expect(200);

            expect(response.body).toMatchSnapshot();

            // Verify it was updated in the database
            const updatedPathway = await Pathway.findById(pathwayId);
            expect(updatedPathway?.name).toBe(updateData.name);
        });

        it('should return 401 when not authenticated', async () => {
            const updateData = {
                name: 'Updated Pathway',
                description: 'Updated Description'
            };

            const response = await request(app)
                .patch(`/api/v1/pathways/${pathwayId}`)
                .send({ pathway: updateData })
                .expect(401);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 403 when not the owner', async () => {
            const updateData = {
                name: 'Updated by Non-Owner',
                description: 'Should Fail'
            };

            const response = await request(app)
                .patch(`/api/v1/pathways/${pathwayId}`)
                .set('Authorization', `Bearer ${anotherUserToken}`)
                .send({ pathway: updateData })
                .expect(403);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 404 for non-existent pathway', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .patch(`/api/v1/pathways/${nonExistentId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ pathway: { name: 'Updated Name' } })
                .expect(404);

            expect(response.body).toMatchSnapshot();
        });
    });

    describe('DELETE /api/v1/pathways/:id', () => {
        it('should delete pathway when owner is authenticated', async () => {
            const response = await request(app)
                .delete(`/api/v1/pathways/${pathwayId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toMatchSnapshot();

            // Verify it was deleted from the database
            const deletedPathway = await Pathway.findById(pathwayId);
            expect(deletedPathway).toBeNull();
        });

        it('should return 401 when not authenticated', async () => {
            const response = await request(app)
                .delete(`/api/v1/pathways/${pathwayId}`)
                .expect(401);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 403 when not the owner', async () => {
            const response = await request(app)
                .delete(`/api/v1/pathways/${pathwayId}`)
                .set('Authorization', `Bearer ${anotherUserToken}`)
                .expect(403);

            expect(response.body).toMatchSnapshot();
        });

        it('should return 404 for non-existent pathway', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .delete(`/api/v1/pathways/${nonExistentId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body).toMatchSnapshot();
        });
    });
});