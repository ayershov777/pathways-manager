import { Pathway } from '../../models/pathway.model';
import { User } from '../../models/user.model';
import mongoose from 'mongoose';

describe('Pathway Model', () => {
    let ownerId: mongoose.Types.ObjectId;

    beforeEach(async () => {
        // Create a test user for ownership
        const user = await User.create({
            email: 'pathwayowner@example.com',
            password: 'password123',
            name: 'Pathway Owner'
        });
        ownerId = user._id;
    });
    
    it('should create a new pathway with valid fields', async () => {
        const pathwayData = {
            name: 'Test Pathway',
            description: 'This is a test pathway',
            owner: ownerId
        };

        const pathway = new Pathway(pathwayData);
        const savedPathway = await pathway.save();

        expect(savedPathway._id).toBeDefined();
        expect(savedPathway.name).toBe(pathwayData.name);
        expect(savedPathway.description).toBe(pathwayData.description);
        expect(savedPathway.modules).toEqual([]);
        expect(savedPathway.owner.toString()).toBe(ownerId.toString());
    });

    it('should fail when required fields are missing', async () => {
        const pathway = new Pathway({});

        let error: any = null;
        try {
            await pathway.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error?.errors?.name).toBeDefined();
        expect(error?.errors?.description).toBeDefined();
        expect(error?.errors?.owner).toBeDefined();
    });

    it('should not allow duplicate pathway names', async () => {
        // Create first pathway
        await new Pathway({
            name: 'Duplicate Pathway',
            description: 'First instance',
            owner: ownerId
        }).save();

        // Try to create another with the same name
        const duplicatePathway = new Pathway({
            name: 'Duplicate Pathway',
            description: 'Second instance',
            owner: ownerId
        });

        let error: any = null;
        try {
            await duplicatePathway.save();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error?.code).toBe(11000); // MongoDB duplicate key error code
    });

    it('should allow same pathway name for different owners', async () => {
        // Create another user
        const anotherUser = await User.create({
            email: 'anotherpathwayowner@example.com',
            password: 'password123',
            name: 'Another Pathway Owner'
        });

        // Create first pathway
        await new Pathway({
            name: 'Same Name Pathway',
            description: 'First instance',
            owner: ownerId
        }).save();

        // Try to create another with the same name but different owner
        const secondPathway = new Pathway({
            name: 'Same Name Pathway',
            description: 'Second instance',
            owner: anotherUser._id
        });

        let error: any = null;
        let savedPathway: any = null;
        
        try {
            savedPathway = await secondPathway.save();
        } catch (e) {
            error = e;
        }

        expect(error).toBeNull();
        expect(savedPathway).toBeDefined();
        expect(savedPathway.name).toBe('Same Name Pathway');
        expect(savedPathway.owner.toString()).toBe(anotherUser._id.toString());
    });
});