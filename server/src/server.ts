import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { router as pathwaysRouter } from "./routes/pathway.routes";

dotenv.config();

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api/v1/pathways', pathwaysRouter);

app.listen(3000, () => {
    console.log("server listening...");
});
