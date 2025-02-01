import { model, Schema } from "mongoose";

const categorySchema = new Schema({
    categoryname: { type: String, required: true, unique: true },
    fields: { type: [String], default: [] }
});

export const categoryModel = model("categories", categorySchema);