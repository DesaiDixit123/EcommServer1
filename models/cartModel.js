import mongoose, { model, Schema } from "mongoose";

const cartSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      subTotal: {
        type: Number,

        default: 0,
      },
    },
  ],
  
  discount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
  },
});

export const Cart = model("Cart", cartSchema);
