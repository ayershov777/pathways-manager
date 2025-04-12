import { Router } from "express";
import { controller as pathwaysCtrl } from "../controllers/pathways.controller";

export const router = Router();

router.get("/", pathwaysCtrl.getAllPathways);

router.get("/:id", pathwaysCtrl.getPathwayById);

router.post("/", pathwaysCtrl.createPathway);

router.delete("/", pathwaysCtrl.removePathway);

router.patch("/:id", pathwaysCtrl.updatePathway);
