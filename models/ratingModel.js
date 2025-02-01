import mongoose, { model, Schema } from "mongoose";
 const ratingSchema = Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        maxlength: 500,
      },
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  })


export const Rating=model('rating',ratingSchema)


