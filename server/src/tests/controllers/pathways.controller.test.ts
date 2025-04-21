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

    beforeEach(() => {
        req = {
            params: {},
            query: {},
            body: {}
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
        it('should create a new pathway', async () => {
            const pathwayData = { name: 'New Pathway', description: 'Description' };
            const mockCreatedPathway = { _id: 'new-id', ...pathwayData };

            req.body = { pathway: pathwayData };
            (pathwayService.create as jest.Mock).mockResolvedValue(mockCreatedPathway);

            await pathwaysController.createPathway(req as Request, res as Response, next);

            expect(pathwayService.create).toHaveBeenCalledWith(pathwayData);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ pathway: mockCreatedPathway });
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
        it('should update an existing pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const updateData = { name: 'Updated Pathway' };
            const mockUpdatedPathway = { _id: pathwayId, ...updateData };

            req.params = { id: pathwayId };
            req.body = { pathway: updateData };

            (pathwayService.update as jest.Mock).mockResolvedValue(mockUpdatedPathway);

            await pathwaysController.updatePathway(req as Request, res as Response, next);

            expect(pathwayService.update).toHaveBeenCalledWith(pathwayId, updateData);
            expect(res.json).toHaveBeenCalledWith({ pathway: mockUpdatedPathway });
        });

        it('should handle non-existent pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            req.params = { id: pathwayId };
            req.body = { pathway: { name: 'Updated Pathway' } };

            (pathwayService.update as jest.Mock).mockResolvedValue(null);
            (createError as jest.Mock).mockReturnValue(new Error('Not found'));

            await pathwaysController.updatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Pathway not found", 404);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('removePathway', () => {
        it('should remove an existing pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const mockRemovedPathway = { _id: pathwayId, name: 'Removed Pathway' };

            req.params = { id: pathwayId };
            (pathwayService.remove as jest.Mock).mockResolvedValue(mockRemovedPathway);

            await pathwaysController.removePathway(req as Request, res as Response, next);

            expect(pathwayService.remove).toHaveBeenCalledWith(pathwayId);
            expect(res.json).toHaveBeenCalledWith({
                message: "Pathway successfully deleted",
                pathway: mockRemovedPathway
            });
        });

        it('should handle non-existent pathway', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            req.params = { id: pathwayId };

            (pathwayService.remove as jest.Mock).mockResolvedValue(null);
            (createError as jest.Mock).mockReturnValue(new Error('Not found'));

            await pathwaysController.removePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith("Pathway not found", 404);
            expect(next).toHaveBeenCalled();
        });
    });
});
