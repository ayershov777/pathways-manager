import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { Pathway } from '../../models/pathway.model';

describe('Pathway Routes', () => {
    let pathwayId: string;

    beforeEach(async () => {
        // Create a test pathway
        const pathway = await Pathway.create({
            name: 'Test Pathway',
            description: 'Test Description'
        });
        pathwayId = pathway._id.toString();

        // Create additional pathways for pagination tests
        const pathways = [];
        for (let i = 1; i <= 15; i++) {
            pathways.push({
                name: `Pathway ${i}`,
                description: `Description ${i}`
            });
        }
        await Pathway.insertMany(pathways);
    });

    describe('GET /api/v1/pathways', () => {
        it('should get all pathways with default pagination', async () => {
            const response = await request(app)
                .get('/api/v1/pathways')
                .expect(200);

            expect(response.body.pathways).toBeDefined();
            expect(response.body.pathways.length).toBeLessThanOrEqual(10);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
        });

        it('should get pathways with custom pagination', async () => {
            const response = await request(app)
                .get('/api/v1/pathways?page=2&limit=5')
                .expect(200);

            expect(response.body.pathways).toBeDefined();
            expect(response.body.pathways.length).toBeLessThanOrEqual(5);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(2);
        });
    });

    describe('GET /api/v1/pathways/:id', () => {
        it('should get a pathway by id', async () => {
            const response = await request(app)
                .get(`/api/v1/pathways/${pathwayId}`)
                .expect(200);

            expect(response.body.pathway).toBeDefined();
            expect(response.body.pathway._id).toBe(pathwayId);
            expect(response.body.pathway.name).toBe('Test Pathway');
        });

        it('should return 404 for non-existent pathway', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .get(`/api/v1/pathways/${nonExistentId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('not found');
        });

        it('should return 400 for invalid id format', async () => {
            const response = await request(app)
                .get('/api/v1/pathways/invalid-id')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('Invalid pathway ID format');
        });
    });

    describe('POST /api/v1/pathways', () => {
        it('should create a new pathway', async () => {
            const newPathway = {
                name: 'New Pathway',
                description: 'New Description'
            };

            const response = await request(app)
                .post('/api/v1/pathways')
                .send({ pathway: newPathway })
                .expect(201);

            expect(response.body.pathway).toBeDefined();
            expect(response.body.pathway.name).toBe(newPathway.name);
            expect(response.body.pathway.description).toBe(newPathway.description);
            expect(response.body.pathway._id).toBeDefined();

            // Verify it was saved to the database
            const savedPathway = await Pathway.findById(response.body.pathway._id);
            expect(savedPathway).toBeDefined();
            expect(savedPathway?.name).toBe(newPathway.name);
        });

        it('should return 400 if pathway object is missing', async () => {
            const response = await request(app)
                .post('/api/v1/pathways')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('must contain a pathway object');
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/v1/pathways')
                .send({ pathway: { name: 'Missing Description' } })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('Validation error');
        });

        it('should return 409 if pathway name already exists', async () => {
            // Try to create a pathway with the same name as our test pathway
            const response = await request(app)
                .post('/api/v1/pathways')
                .send({
                    pathway: {
                        name: 'Test Pathway',
                        description: 'Duplicate name'
                    }
                })
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('unavailable');
        });
    });

    describe('PATCH /api/v1/pathways/:id', () => {
        it('should update an existing pathway', async () => {
            const updateData = {
                name: 'Updated Pathway',
                description: 'Updated Description'
            };

            const response = await request(app)
                .patch(`/api/v1/pathways/${pathwayId}`)
                .send({ pathway: updateData })
                .expect(200);

            expect(response.body.pathway).toBeDefined();
            expect(response.body.pathway.name).toBe(updateData.name);
            expect(response.body.pathway.description).toBe(updateData.description);
            expect(response.body.pathway._id).toBe(pathwayId);

            // Verify it was updated in the database
            const updatedPathway = await Pathway.findById(pathwayId);
            expect(updatedPathway?.name).toBe(updateData.name);
        });

        it('should return 404 for non-existent pathway', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .patch(`/api/v1/pathways/${nonExistentId}`)
                .send({ pathway: { name: 'Updated Name' } })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('not found');
        });

        it('should return 400 if pathway object is missing', async () => {
            const response = await request(app)
                .patch(`/api/v1/pathways/${pathwayId}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('must contain a pathway object');
        });
    });

    describe('DELETE /api/v1/pathways/:id', () => {
        it('should delete an existing pathway', async () => {
            const response = await request(app)
                .delete(`/api/v1/pathways/${pathwayId}`)
                .expect(200);

            expect(response.body.message).toContain('successfully deleted');
            expect(response.body.pathway._id).toBe(pathwayId);

            // Verify it was deleted from the database
            const deletedPathway = await Pathway.findById(pathwayId);
            expect(deletedPathway).toBeNull();
        });

        it('should return 404 for non-existent pathway', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .delete(`/api/v1/pathways/${nonExistentId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('not found');
        });
    });
});
