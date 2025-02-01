import { model, Schema } from "mongoose";

const productSchema = Schema({
    category: { type: String },
    fields: [{ type: String }],
    img1: { type: String },
    img2: { type: String },
    img3: { type: String },
    img4: { type: String },
    img5: { type: String },
    title: { type: String },
    price: { type: Number },
    averageRating: {
        type: Number,
        default: 0,
      },
      
    discount: { type: Number, default: 0 },
    qnt: { type: Number },
    discription: { type: String },
    publishedDate: { type: Date, default: Date.now }
}, { timestamps: true } )

export const $productModel= model("product", productSchema)