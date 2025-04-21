import { Router } from "express";
import { controller as pathwaysCtrl } from "../controllers/pathways.controller";
import { validateCreatePathway, validateUpdatePathway, validatePathwayId } from "../middleware/validators/pathways.validators";

export const router = Router();

/**
 * @route GET /api/v1/pathways
 * @description Get all pathways with pagination
 * @access Public
 */
router.get("/", pathwaysCtrl.getAllPathways);

/**
 * @route GET /api/v1/pathways/:id
 * @description Get a pathway by ID
 * @access Public
 */
router.get("/:id", validatePathwayId, pathwaysCtrl.getPathwayById);

/**
 * @route POST /api/v1/pathways
 * @description Create a new pathway
 * @access Public
 */
router.post("/", validateCreatePathway, pathwaysCtrl.createPathway);

/**
 * @route DELETE /api/v1/pathways/:id
 * @description Delete a pathway by ID
 * @access Public
 */
router.delete("/:id", validatePathwayId, pathwaysCtrl.removePathway);

/**
 * @route PATCH /api/v1/pathways/:id
 * @description Update a pathway by ID
 * @access Public
 */
router.patch("/:id", validatePathwayId, validateUpdatePathway, pathwaysCtrl.updatePathway);