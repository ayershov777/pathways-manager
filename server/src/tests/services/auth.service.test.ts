import * as authService from '../../services/auth.service';
import { User } from '../../models/user.model';

describe('Auth Service', () => {
    let userId: string;
    const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
    };

    beforeEach(async () => {
        // Create a test user
        const user = await User.create(userData);
        userId = user._id.toString();
    });

    describe('findUserByEmail', () => {
        it('should find a user by email without password', async () => {
            const user = await authService.findUserByEmail(userData.email);

            expect(user).toBeDefined();
            expect(user?.email).toBe(userData.email);
            expect(user?.name).toBe(userData.name);
            expect(user?.password).toBeUndefined();
        });

        it('should return null for non-existent email', async () => {
            const user = await authService.findUserByEmail('nonexistent@example.com');
            expect(user).toBeNull();
        });
    });

    describe('findUserByEmailWithPassword', () => {
        it('should find a user by email with password', async () => {
            const user = await authService.findUserByEmailWithPassword(userData.email);

            expect(user).toBeDefined();
            expect(user?.email).toBe(userData.email);
            expect(user?.name).toBe(userData.name);
            expect(user?.password).toBeDefined();
        });

        it('should return null for non-existent email', async () => {
            const user = await authService.findUserByEmailWithPassword('nonexistent@example.com');
            expect(user).toBeNull();
        });
    });

    describe('createUser', () => {
        it('should create a new user and return without password', async () => {
            const newUserData = {
                email: 'new@example.com',
                password: 'newpassword123',
                name: 'New User'
            };

            const newUser = await authService.createUser(newUserData);

            expect(newUser).toBeDefined();
            expect(newUser.email).toBe(newUserData.email);
            expect(newUser.name).toBe(newUserData.name);
            expect(newUser._id).toBeDefined();
            expect(newUser.password).toBeUndefined();
        });
    });
});
