import { Router } from "express";
import { verificationUser } from "../controllers/userController.js";
import { addRating, getAverageRating, getRatingsForProduct } from "../controllers/ratingControllers.js";

export const ratingRouter=Router()

ratingRouter.post("/addrating", verificationUser, addRating)
ratingRouter.get("/product/:productId",getRatingsForProduct)
ratingRouter.get("/product/:productId/average",getAverageRating)