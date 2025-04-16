import dotenv from "dotenv";
import app from "./app";
import { connectDb } from "./config/db";

// Load environment variables first
dotenv.config();

// Set port
const PORT = process.env.PORT || 3000;

/**
 * Start server function
 */
const startServer = async () => {
    try {
        // Connect to database first
        await connectDb();

        // Start server after successful database connection
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}...`);
        });
    } catch (err) {
        console.error('Failed to connect to database. Server not started.');
        console.error(err);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error.name, error.message);
    process.exit(1);
});

// Start the server
startServer();