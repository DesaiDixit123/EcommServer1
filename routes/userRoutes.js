import { Router } from "express";
import { addToCart, addToWishlist, clearCart, deleteUser, forgetPassword, getCartByUserId, getUser, login, register, removeProductFromCart, removeWishlist, resetPassword, updateCart, updatePassword, updateProfile, userLogout, verificationUser, verifyOTP, verifyUser } from "../controllers/userController.js";
// import { verify } from "jsonwebtoken";

export const UserRoute=Router()

UserRoute.post("/register",register)
UserRoute.post("/login",login);
UserRoute.route("/").get(verificationUser, verifyUser);
UserRoute.post("/logout",userLogout);
UserRoute.post("/forget-password",forgetPassword);
UserRoute.post("/verify-otp",verifyOTP);
UserRoute.post("/reset-password",resetPassword);
UserRoute.post("/update-Password",updatePassword);
UserRoute.post("/update-Profile",updateProfile);
UserRoute.get("/users",getUser)
UserRoute.delete("/user/delete/:id", deleteUser);
UserRoute.post("/AddToWishlist", verificationUser, addToWishlist);
UserRoute.post("/RemoveWishlsit", verificationUser, removeWishlist);
UserRoute.post("/addToCart", verificationUser, addToCart);
UserRoute.get("/cart/:userId", getCartByUserId);
UserRoute.put("/updateCart", updateCart);
UserRoute.delete("/clearCart/:userId", clearCart);
UserRoute.delete("/cart/:userId/product/:productId", removeProductFromCart);
