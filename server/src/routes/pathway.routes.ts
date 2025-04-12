import { Router } from "express";
import { controller as pathwaysCtrl } from "../controllers/pathways.controller";
import { validateCreatePathway, validateUpdatePathway } from "../middleware/validation.middleware";

export const router = Router();

router.get("/", pathwaysCtrl.getAllPathways);

router.get("/:id", pathwaysCtrl.getPathwayById);

router.post("/", validateCreatePathway, pathwaysCtrl.createPathway);

router.delete("/:id", pathwaysCtrl.removePathway);

router.patch("/:id", validateUpdatePathway, pathwaysCtrl.updatePathway);