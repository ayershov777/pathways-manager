import { Router } from "express";
import { controller as pathwaysCtrl } from "../controllers/pathways.controller";
import { validateCreatePathway, validateUpdatePathway, validatePathwayId } from "../middleware/validators/pathways.validators";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";

export const router = Router();

/**
 * @route GET /api/v1/pathways
 * @description Get all pathways with pagination
 * @access Public
 */
router.get("/", optionalAuth, pathwaysCtrl.getAllPathways);

/**
 * @route GET /api/v1/pathways/:id
 * @description Get a pathway by ID
 * @access Public
 */
router.get("/:id", optionalAuth, validatePathwayId, pathwaysCtrl.getPathwayById);

/**
 * @route POST /api/v1/pathways
 * @description Create a new pathway
 * @access Private
 */
router.post("/", requireAuth, validateCreatePathway, pathwaysCtrl.createPathway);

/**
 * @route DELETE /api/v1/pathways/:id
 * @description Delete a pathway by ID
 * @access Private - owner only
 */
router.delete("/:id", requireAuth, validatePathwayId, pathwaysCtrl.removePathway);

/**
 * @route PATCH /api/v1/pathways/:id
 * @description Update a pathway by ID
 * @access Private - owner only
 */
router.patch("/:id", requireAuth, validatePathwayId, validateUpdatePathway, pathwaysCtrl.updatePathway);