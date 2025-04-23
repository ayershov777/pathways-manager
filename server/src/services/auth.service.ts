import { User } from "../models/user.model";

/**
 * Find user by email
 * Excludes password field from the result
 */
export const findUserByEmail = async (email: string) => {
    return User.findOne({ email }).select('-password');
};

/**
 * Find user by email with password (for authentication)
 */
export const findUserByEmailWithPassword = async (email: string) => {
    return User.findOne({ email });
};

/**
 * Create a new user
 * Returns the created user without the password field
 */
export const createUser = async (userData: { email: string; password: string; name: string }) => {
    const user = await User.create(userData);
    // Return user without password
    return user.toObject({ transform: (_, ret) => {
        const obj = { ...ret };
        delete obj.password;
        return obj;
    }});
};
