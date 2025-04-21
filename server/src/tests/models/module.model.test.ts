import { Module } from '../../models/module.model';

describe('Module Model', () => {
    it('should create a new module with valid fields', async () => {
        const moduleData = {
            key: 'TEST001',
            name: 'Test Module',
            prerequisites: [['PRE001']]
        };

        const module = new Module(moduleData);
        const savedModule = await module.save();

        expect(savedModule._id).toBeDefined();
        expect(savedModule.key).toBe(moduleData.key);
        expect(savedModule.name).toBe(moduleData.name);
        expect(savedModule.prerequisites).toEqual(moduleData.prerequisites);
    });

    it('should fail when required fields are missing', async () => {
        const module = new Module({});

        let error: any = null;
        try {
            await module.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error?.errors?.key).toBeDefined();
        expect(error?.errors?.name).toBeDefined();
    });

    it('should not allow duplicate module keys', async () => {
        // Create first module
        await new Module({
            key: 'DUP001',
            name: 'First Module'
        }).save();

        // Try to create another with the same key
        const duplicateModule = new Module({
            key: 'DUP001',
            name: 'Second Module'
        });

        let error: any = null;
        try {
            await duplicateModule.save();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error?.code).toBe(11000); // MongoDB duplicate key error code
    });
});
