import { User } from '../../models/user.model';
import bcrypt from 'bcrypt';

describe('User Model', () => {
    it('should create a new user with valid fields', async () => {
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.name).toBe(userData.name);
        // Password should be hashed
        expect(savedUser.password).not.toBe(userData.password);
    });

    it('should fail when required fields are missing', async () => {
        const user = new User({});

        let error: any = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error?.errors?.email).toBeDefined();
        expect(error?.errors?.password).toBeDefined();
        expect(error?.errors?.name).toBeDefined();
    });

    it('should not allow duplicate emails', async () => {
        // Create first user
        await new User({
            email: 'duplicate@example.com',
            password: 'password123',
            name: 'First User'
        }).save();

        // Try to create another with the same email
        const duplicateUser = new User({
            email: 'duplicate@example.com',
            password: 'different123',
            name: 'Second User'
        });

        let error: any = null;
        try {
            await duplicateUser.save();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error?.code).toBe(11000); // MongoDB duplicate key error code
    });

    it('should hash the password before saving', async () => {
        const plainPassword = 'testPassword123';
        const user = new User({
            email: 'hash@example.com',
            password: plainPassword,
            name: 'Hash Test'
        });

        const savedUser = await user.save();
        expect(savedUser.password).not.toBe(plainPassword);
        
        // Verify we can use bcrypt.compare to check the password
        const isMatch = await bcrypt.compare(plainPassword, savedUser.password);
        expect(isMatch).toBe(true);
    });

    it('should compare passwords correctly', async () => {
        const plainPassword = 'testPassword123';
        const user = new User({
            email: 'compare@example.com',
            password: plainPassword,
            name: 'Compare Test'
        });

        await user.save();

        // Test correct password
        const correctMatch = await user.comparePassword(plainPassword);
        expect(correctMatch).toBe(true);

        // Test incorrect password
        const incorrectMatch = await user.comparePassword('wrongPassword');
        expect(incorrectMatch).toBe(false);
    });
});