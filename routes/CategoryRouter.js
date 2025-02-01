import  { Router } from "express";
import { categories, deleteCategory, deleteFieldFromCategory, getAllCategory, getFieldsForcategory, updateCategory } from "../controllers/categoryController.js";

export const CategoryRouter = Router()

CategoryRouter.route("/admin/category").post(categories);
CategoryRouter.route("/admin/get/category").get(getAllCategory);
CategoryRouter.route("/admin/get/category/fields/:categoryname").get(getFieldsForcategory);
CategoryRouter.route("/admin/get/category/:id").delete(deleteCategory);
CategoryRouter.route("/admin/get/category/:id").put(updateCategory);
CategoryRouter.route("/admin/get/category/deleteField/:id").delete(deleteFieldFromCategory);