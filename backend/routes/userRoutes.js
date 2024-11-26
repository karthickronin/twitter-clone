import express from "express";
import {getProfile,followUnFollowUser, getSuggestedUser, updateUser} from "../controllers/user.controllers.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/profile/:username",protectRoute, getProfile);
router.post("/follow/:id",protectRoute, followUnFollowUser);
router.get("/suggested",protectRoute, getSuggestedUser);
router.post("/update",protectRoute, updateUser);


export default router;
