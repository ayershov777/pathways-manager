import { Request, Response } from 'express';
import { controller as pathwaysController } from '../../controllers/pathways.controller';
import * as pathwayService from '../../services/database/pathways.service';
import { createError } from '../../middleware/error.middleware';
import mongoose from 'mongoose';

// Mock the pathway service
jest.mock('../../services/database/pathways.service');
jest.mock('../../middleware/error.middleware');

describe('Pathways Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    const userId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        req = {
            params: {},
            query: {},
            body: {},
            user: { id: userId }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('getAllPathways', () => {
        it('should get all pathways with default pagination', async () => {
            const mockResult = {
                items: [{ _id: 'id1', name: 'Pathway 1' }],
                pagination: {
                    total: 1,
                    page: 1,
                    pages: 1
                }
            };

            (pathwayService.findAll as jest.Mock).mockResolvedValue(mockResult);

            await pathwaysController.getAllPathways(req as Request, res as Response, next);

            expect(pathwayService.findAll).toHaveBeenCalledWith(1, 10);
            expect(res.json).toHaveBeenCalledWith({
                pathways: mockResult.items,
                pagination: mockResult.pagination
            });
        });

        it('should handle custom pagination parameters', async () => {
            req.query = { page: '2', limit: '20' };

            const mockResult = {
                items: [{ _id: 'id1', name: 'Pathway 1' }],
                pagination: {
                    total: 21,
                    page: 2,
                    pages: 2
                }
            };

            (pathwayService.findAll as jest.Mock).mockResolvedValue(mockResult);

            await pathwaysController.getAllPathways(req as Request, res as Response, next);

            expect(pathwayService.findAll).toHaveBeenCalledWith(2, 20);
            expect(res.json).toHaveBeenCalledWith({
                pathways: mockResult.items,
                pagination: mockResult.pagination
            });
        });

        it('should handle service errors', async () => {
            const error = new Error('Service error');
            (pathwayService.findAll as jest.Mock).mockRejectedValue(error);

            await pathwaysController.getAllPathways(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getPathwayById', () => {
        it('should get a pathway by ID', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const mockPathway = { _id: pathwayId, name: 'Test Pathway' };

            req.params = { id: pathwayId };
            (pathwayService.findById as jest.Mock).mockResolvedValue(mockPathway);

            await pathwaysController.getPathwayById(req as Request, res as Response, next);

            expect(pathwayService.findById).toHaveBeenCalledWith(pathwayId);
            expect(res.json).toHaveBeenCalledWith({ pathway: mockPathway });
        });

        it('should handle non-existent pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            req.params = { id: pathwayId };

            (pathwayService.findById as jest.Mock).mockResolvedValue(null);
            (createError as jest.Mock).mockReturnValue(new Error('Not found'));

            await pathwaysController.getPathwayById(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Pathway not found", 404);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('createPathway', () => {
        it('should create a new pathway with owner', async () => {
            const pathwayData = { name: 'New Pathway', description: 'Description' };
            const mockCreatedPathway = { _id: 'new-id', ...pathwayData, owner: userId };

            req.body = { pathway: pathwayData };
            (pathwayService.create as jest.Mock).mockResolvedValue(mockCreatedPathway);

            await pathwaysController.createPathway(req as Request, res as Response, next);

            expect(pathwayService.create).toHaveBeenCalledWith({
                ...pathwayData,
                owner: userId
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ pathway: mockCreatedPathway });
        });

        it('should return 401 if user is not authenticated', async () => {
            // Remove user from request
            req.user = undefined;
            req.body = { pathway: { name: 'New Pathway' } };
            
            (createError as jest.Mock).mockReturnValue(new Error('Auth required'));

            await pathwaysController.createPathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Authentication required", 401);
            expect(next).toHaveBeenCalled();
            expect(pathwayService.create).not.toHaveBeenCalled();
        });

        it('should handle service errors', async () => {
            const error = new Error('Create error');
            req.body = { pathway: { name: 'New Pathway' } };

            (pathwayService.create as jest.Mock).mockRejectedValue(error);

            await pathwaysController.createPathway(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('updatePathway', () => {
        it('should update a pathway owned by the user', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const updateData = { name: 'Updated Pathway' };
            const mockPathway = { _id: pathwayId, name: 'Original Pathway', owner: { _id: userId } };
            const mockUpdatedPathway = { _id: pathwayId, ...updateData, owner: { _id: userId } };

            req.params = { id: pathwayId };
            req.body = { pathway: updateData };

            (pathwayService.findById as jest.Mock).mockResolvedValue(mockPathway);
            (pathwayService.update as jest.Mock).mockResolvedValue(mockUpdatedPathway);

            await pathwaysController.updatePathway(req as Request, res as Response, next);

            expect(pathwayService.findById).toHaveBeenCalledWith(pathwayId);
            expect(pathwayService.update).toHaveBeenCalledWith(pathwayId, updateData);
            expect(res.json).toHaveBeenCalledWith({ pathway: mockUpdatedPathway });
        });

        it('should return 401 if user is not authenticated', async () => {
            // Remove user from request
            req.user = undefined;
            const pathwayId = new mongoose.Types.ObjectId().toString();
            req.params = { id: pathwayId };
            req.body = { pathway: { name: 'Updated Pathway' } };
            
            (createError as jest.Mock).mockReturnValue(new Error('Auth required'));

            await pathwaysController.updatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Authentication required", 401);
            expect(next).toHaveBeenCalled();
            expect(pathwayService.update).not.toHaveBeenCalled();
        });

        it('should return 404 for non-existent pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            req.params = { id: pathwayId };
            req.body = { pathway: { name: 'Updated Pathway' } };

            (pathwayService.findById as jest.Mock).mockResolvedValue(null);
            (createError as jest.Mock).mockReturnValue(new Error('Not found'));

            await pathwaysController.updatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Pathway not found", 404);
            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if user does not own the pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const anotherUserId = new mongoose.Types.ObjectId().toString();
            const mockPathway = { 
                _id: pathwayId, 
                name: 'Original Pathway', 
                owner: { _id: anotherUserId }
            };

            req.params = { id: pathwayId };
            req.body = { pathway: { name: 'Updated Pathway' } };

            (pathwayService.findById as jest.Mock).mockResolvedValue(mockPathway);
            (createError as jest.Mock).mockReturnValue(new Error('Not authorized'));

            await pathwaysController.updatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Not authorized to update this pathway", 403);
            expect(next).toHaveBeenCalled();
            expect(pathwayService.update).not.toHaveBeenCalled();
        });
    });

    describe('removePathway', () => {
        it('should remove a pathway owned by the user', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const mockPathway = { _id: pathwayId, name: 'Pathway to Delete', owner: { _id: userId } };

            req.params = { id: pathwayId };

            (pathwayService.findById as jest.Mock).mockResolvedValue(mockPathway);
            (pathwayService.remove as jest.Mock).mockResolvedValue(mockPathway);

            await pathwaysController.removePathway(req as Request, res as Response, next);

            expect(pathwayService.findById).toHaveBeenCalledWith(pathwayId);
            expect(pathwayService.remove).toHaveBeenCalledWith(pathwayId);
            expect(res.json).toHaveBeenCalledWith({
                message: "Pathway successfully deleted",
                pathway: mockPathway
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            // Remove user from request
            req.user = undefined;
            const pathwayId = new mongoose.Types.ObjectId().toString();
            req.params = { id: pathwayId };
            
            (createError as jest.Mock).mockReturnValue(new Error('Auth required'));

            await pathwaysController.removePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Authentication required", 401);
            expect(next).toHaveBeenCalled();
            expect(pathwayService.remove).not.toHaveBeenCalled();
        });

        it('should return 404 for non-existent pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            req.params = { id: pathwayId };

            (pathwayService.findById as jest.Mock).mockResolvedValue(null);
            (createError as jest.Mock).mockReturnValue(new Error('Not found'));

            await pathwaysController.removePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Pathway not found", 404);
            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if user does not own the pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const anotherUserId = new mongoose.Types.ObjectId().toString();
            const mockPathway = { 
                _id: pathwayId, 
                name: 'Original Pathway', 
                owner: { _id: anotherUserId }
            };

            req.params = { id: pathwayId };

            (pathwayService.findById as jest.Mock).mockResolvedValue(mockPathway);
            (createError as jest.Mock).mockReturnValue(new Error('Not authorized'));

            await pathwaysController.removePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Not authorized to delete this pathway", 403);
            expect(next).toHaveBeenCalled();
            expect(pathwayService.remove).not.toHaveBeenCalled();
        });
    });
});