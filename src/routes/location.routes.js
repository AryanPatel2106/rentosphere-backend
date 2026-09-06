import { Router } from "express";
import { autocompleteLocation } from "../controllers/location.controller.js";

const router = Router();

router.get("/autocomplete", autocompleteLocation);

export default router;