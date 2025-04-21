import { Request, Response } from 'express';
import {
    validateCreatePathway,
    validateUpdatePathway,
    validatePathwayId
} from '../../../middleware/validators/pathways.validators';
import { createError } from '../../../middleware/error.middleware';
import { Pathway } from '../../../models/pathway.model';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../middleware/error.middleware');
jest.mock('../../../models/pathway.model');

describe('Pathway Validators', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = {
            params: {},
            body: {}
        };
        res = {};
        next = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('validatePathwayId', () => {
        it('should call next if the ID is valid', () => {
            const validId = new mongoose.Types.ObjectId().toString();
            req.params = { id: validId };

            validatePathwayId(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(createError).not.toHaveBeenCalled();
        });

        it('should return an error if the ID is invalid', () => {
            req.params = { id: 'invalid-id' };
            (createError as jest.Mock).mockReturnValue(new Error('Invalid ID'));

            validatePathwayId(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith('Invalid pathway ID format', 400);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('validateCreatePathway', () => {
        it('should call next if the request body is valid', async () => {
            req.body = {
                pathway: {
                    name: 'Valid Pathway',
                    description: 'Valid Description'
                }
            };

            (Pathway.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null)
                })
            });

            await validateCreatePathway(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should return an error if the pathway object is missing', async () => {
            req.body = {};
            (createError as jest.Mock).mockReturnValue(new Error('Missing pathway'));

            await validateCreatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith(
                'Request body must contain a pathway object',
                400
            );
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should return an error if required fields are missing', async () => {
            req.body = {
                pathway: {
                    // Missing required fields
                }
            };
            (createError as jest.Mock).mockReturnValue(new Error('Validation error'));

            await validateCreatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith(
                expect.stringContaining('Validation error'),
                400
            );
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should return an error if the name is already used', async () => {
            req.body = {
                pathway: {
                    name: 'Existing Pathway',
                    description: 'Description'
                }
            };

            (Pathway.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ _id: 'existing-id' })
                })
            });

            (createError as jest.Mock).mockReturnValue(new Error('Name taken'));

            await validateCreatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith(
                'The specified pathway name is unavailable.',
                409
            );
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('validateUpdatePathway', () => {
        it('should call next if the request body is valid', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            req.params = { id: pathwayId };
            req.body = {
                pathway: {
                    name: 'Updated Name'
                }
            };

            (Pathway.findById as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        name: 'Original Name'
                    })
                })
            });

            (Pathway.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null)
                })
            });

            await validateUpdatePathway(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should return an error if the pathway object is missing', async () => {
            req.params = { id: new mongoose.Types.ObjectId().toString() };
            req.body = {};

            (createError as jest.Mock).mockReturnValue(new Error('Missing pathway'));

            await validateUpdatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith(
                'Request body must contain a pathway object',
                400
            );
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should not check name uniqueness if name is not changing', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const existingName = 'Existing Name';

            req.params = { id: pathwayId };
            req.body = {
                pathway: {
                    name: existingName,
                    description: 'Updated description'
                }
            };

            // Mock finding the current pathway with the same name
            (Pathway.findById as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        name: existingName
                    })
                })
            });

            await validateUpdatePathway(req as Request, res as Response, next);

            // We should not check for uniqueness since name isn't changing
            expect(Pathway.findOne).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith();
        });

        it('should return an error if updating to a name that already exists', async () => {
            const pathwayId = new mongoose.Types.ObjectId().toString();
            const newName = 'New Name';

            req.params = { id: pathwayId };
            req.body = {
                pathway: {
                    name: newName
                }
            };

            // Mock finding the current pathway
            (Pathway.findById as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        name: 'Original Name'
                    })
                })
            });

            // Mock finding another pathway with the same name
            (Pathway.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ _id: 'other-id' })
                })
            });

            (createError as jest.Mock).mockReturnValue(new Error('Name taken'));

            await validateUpdatePathway(req as Request, res as Response, next);

            expect(createError).toHaveBeenCalledWith(
                'The specified pathway name is unavailable.',
                409
            );
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
