import { Pathway } from '../../models/pathway.model';

describe('Pathway Model', () => {
    it('should create a new pathway with valid fields', async () => {
        const pathwayData = {
            name: 'Test Pathway',
            description: 'This is a test pathway'
        };

        const pathway = new Pathway(pathwayData);
        const savedPathway = await pathway.save();

        expect(savedPathway._id).toBeDefined();
        expect(savedPathway.name).toBe(pathwayData.name);
        expect(savedPathway.description).toBe(pathwayData.description);
        expect(savedPathway.modules).toEqual([]);
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
    });

    it('should not allow duplicate pathway names', async () => {
        // Create first pathway
        await new Pathway({
            name: 'Duplicate Pathway',
            description: 'First instance'
        }).save();

        // Try to create another with the same name
        const duplicatePathway = new Pathway({
            name: 'Duplicate Pathway',
            description: 'Second instance'
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
});