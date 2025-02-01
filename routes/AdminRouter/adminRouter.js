import { Router } from "express";
import { adminLogin, adminLogout, adminverification, verifyAdmin } from "../../controllers/Admin/adminController.js";

export const adminRouter = Router()

adminRouter.route("/admin/login").post(adminLogin);
adminRouter.route("/admin/logout").post(adminLogout);
adminRouter.route("/admin").get(adminverification, verifyAdmin)