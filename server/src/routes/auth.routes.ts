import { Router } from "express";
import { controller as authCtrl } from "../controllers/auth.controller";
import { validateSignup, validateLogin } from "../middleware/validators/auth.validators";

export const router = Router();

/**
 * @route POST /api/v1/auth/signup
 * @description Register a new user
 * @access Public
 */
router.post("/signup", validateSignup, authCtrl.signup);

/**
 * @route POST /api/v1/auth/login
 * @description Login user
 * @access Public
 */
router.post("/login", validateLogin, authCtrl.login);