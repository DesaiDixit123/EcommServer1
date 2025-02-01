import{ model, Schema } from "mongoose";

const contactShema = Schema({
    name: { type: String },
    ConatctNo: { type: Number },
    email: { type: String },
    message:{type:String}
})
 

export const conatctModel=model("contact",contactShema)