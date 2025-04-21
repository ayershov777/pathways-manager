import express from "express";
import cors from "cors";
import morgan from "morgan";
import { router as pathwaysRouter } from "./routes/pathways.routes";
import { routeNotFoundMiddleware, errorHandlerMiddleware } from "./middleware/error.middleware";

/**
 * Create and configure Express application
 */
const createApp = () => {
    // Initialize Express app
    const app = express();

    // Apply middleware
    app.use(morgan('dev'));
    app.use(cors());
    app.use(express.json());

    // Mount routes
    app.use('/api/v1/pathways', pathwaysRouter);

    // 404 handler - must come after all routes
    app.use(routeNotFoundMiddleware);

    // Global error handler - must be the last middleware
    app.use(errorHandlerMiddleware);

    return app;
};

// Create the application
const app = createApp();

export default app;