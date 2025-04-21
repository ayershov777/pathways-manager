import * as pathwayService from '../../../services/database/pathways.service';
import { Pathway } from '../../../models/pathway.model';
import mongoose from 'mongoose';

describe('Pathway Service', () => {
    let testPathwayId: string;

    beforeEach(async () => {
        // Create a test pathway
        const pathway = await Pathway.create({
            name: 'Test Pathway',
            description: 'Test Description'
        });
        testPathwayId = pathway._id.toString();

        // Create multiple pathways for pagination tests
        const pathwayPromises = [];
        for (let i = 1; i <= 15; i++) {
            pathwayPromises.push(
                Pathway.create({
                    name: `Pathway ${i}`,
                    description: `Description ${i}`
                })
            );
        }
        await Promise.all(pathwayPromises);
    });

    describe('findAll', () => {
        it('should return pathways with pagination', async () => {
            const page = 1;
            const limit = 10;

            const result = await pathwayService.findAll(page, limit);

            expect(result.items).toBeDefined();
            expect(result.items.length).toBeLessThanOrEqual(limit);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.total).toBeGreaterThan(0);
            expect(result.pagination.page).toBe(page);
            expect(result.pagination.pages).toBeGreaterThanOrEqual(1);
        });

        it('should paginate correctly', async () => {
            // First page
            const firstPage = await pathwayService.findAll(1, 5);
            expect(firstPage.items.length).toBe(5);

            // Second page
            const secondPage = await pathwayService.findAll(2, 5);
            expect(secondPage.items.length).toBe(5);

            // Make sure we have different items on each page
            const firstPageIds = firstPage.items.map(p => p._id.toString());
            const secondPageIds = secondPage.items.map(p => p._id.toString());

            const intersection = firstPageIds.filter(id => secondPageIds.includes(id));
            expect(intersection.length).toBe(0);
        });
    });

    describe('findById', () => {
        it('should find a pathway by id', async () => {
            const pathway = await pathwayService.findById(testPathwayId);

            expect(pathway).toBeDefined();
            expect(pathway?._id.toString()).toBe(testPathwayId);
            expect(pathway?.name).toBe('Test Pathway');
        });

        it('should return null for non-existent id', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const pathway = await pathwayService.findById(nonExistentId);

            expect(pathway).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new pathway', async () => {
            const pathwayData = {
                name: 'New Pathway',
                description: 'New Description'
            };

            const pathway = await pathwayService.create(pathwayData);

            expect(pathway).toBeDefined();
            expect(pathway?.name).toBe(pathwayData.name);
            expect(pathway?.description).toBe(pathwayData.description);
            expect(pathway?._id).toBeDefined();
        });
    });

    describe('update', () => {
        it('should update an existing pathway', async () => {
            const updateData = {
                name: 'Updated Pathway',
                description: 'Updated Description'
            };

            const updatedPathway = await pathwayService.update(testPathwayId, updateData);

            expect(updatedPathway).toBeDefined();
            expect(updatedPathway?.name).toBe(updateData.name);
            expect(updatedPathway?.description).toBe(updateData.description);
            expect(updatedPathway?._id.toString()).toBe(testPathwayId);
        });

        it('should return null for non-existent id', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const updatedPathway = await pathwayService.update(nonExistentId, {
                name: 'Updated Name'
            });

            expect(updatedPathway).toBeNull();
        });
    });

    describe('remove', () => {
        it('should remove an existing pathway', async () => {
            const removedPathway = await pathwayService.remove(testPathwayId);

            expect(removedPathway).toBeDefined();
            expect(removedPathway?._id.toString()).toBe(testPathwayId);

            // Verify it's actually removed
            const pathway = await pathwayService.findById(testPathwayId);
            expect(pathway).toBeNull();
        });

        it('should return null for non-existent id', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const removedPathway = await pathwayService.remove(nonExistentId);

            expect(removedPathway).toBeNull();
        });
    });
});
