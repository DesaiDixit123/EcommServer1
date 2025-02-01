import {model, Schema} from "mongoose"

const userSchema=Schema({
    fname:{type:String},
    lname:{type:String},
    username:{type:String},
    email_id:{type:String},
    password:{type:String},
  
    phone_no:{type:Number},
    token:{type:String,default:""},
    isAdmin:{type:Boolean,default:false},
    createdAt:{type:Date,default:Date.now},
    resetPasswordOtp:{type:String},
    resetPasswordExpires:{type:Date},
    cart: { type: Array, default: [] },
    wishlist: { type: Array, default: [] },

})


export const UserModel=model("user",userSchema)