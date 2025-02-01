import { UserModel } from "../models/userModel.js"
import bcrypt from "bcryptjs"
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer"
import multer from "multer"
import { Cart } from "../models/cartModel.js"
import { $productModel } from "../models/productsModel.js"
dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDE_NAME,
    api_key: process.env.CLOUDE_API_KEY,
    api_secret: process.env.CLOUDE_API_SECRET_KEY
})

export const upload = multer({
    storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            format: async (req, file) => "png",
            folder: "Ecomm-user-profile",
            allowed_format: ["jpg", "png", "jpeg", "gif"],
            transformation: [{ width: 500, height: 500 }]
        },


    }),
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpeg|jpg|png|gif)$/)) {
            return cb(new Error("Only image files are allowed!"), false)

        }
        cb(null, true)
    },
    limits: { fileSize: 1024 * 1024 * 5 }

})

export const register = async (req, res) => {

    console.log(req.body)
    try {
        const { fname, lname, email_id, password, username, confirmPassword,phone_no } = req.body

      

        console.log(req.file)


        if (!fname || !lname || !email_id || !password || !username || !confirmPassword) throw new Error("All fuield are requried.")


        // does not created same user
        const findUser = await UserModel.findOne({
            $or: [{ username }, { email_id }]

        })

        if (findUser) throw new Error("User already exits.")

        if (username.length < 3 || username.length > 20) throw new Error("Username must be between 3 to 20 characters.")
        if (password.length < 8) throw new Error("Password must be contain 8 characters")
        if (!/[a-z]/.test(password)) throw new Error("Password must be contain at least one lowercase")
        if (!/[A-Z]/.test(password)) throw new Error("Password must be contain at least one uppercase")
        if (!/[0-9]/.test(password)) throw new Error("Password must be contain at least one number")
        if (!/[^a-zA-Z0-9]/.test(password)) throw new Error("Password must be contain at least one special characters")
        if (password !== confirmPassword) throw new Error("Password and confirm password do not match.")

        const hashPassword = await bcrypt.hash(password, 10)

        const user = await UserModel({
             fname, lname, email_id, password: hashPassword, username, confirmPassword

        }).save()

        res.status(201).send({
            process: true,
            message: "User craeted successfully...",
            data: user
        })
    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message
        })

    }

}

//login mate
export const login = async (req, res) => {
    try {
        const { identifiers, password } = req.body;
        console.log(req.body);

        if (!identifiers) throw new Error("Username/Email Requried.");
        if (!password) throw new Error("Password is requried.");

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifiers);

        let findUser;
        if (isEmail) {
            findUser = await UserModel.findOne({ email_id: identifiers });
        }
        else {
            findUser = await UserModel.findOne({ username: identifiers });
        }
        if (!findUser) throw new Error("User not found.");

        const checkPassword = await bcrypt.compare(password, findUser.password);
        console.log('User Password:', findUser.password);  // The hashed password from the database
        console.log('Entered Password:', password);  // The plain-text password entered by the user



        if (checkPassword) {
            const createToken = jwt.sign(
                { id: findUser._id },
                process.env.secureToke,
                { expiresIn: "30m" }
            )
            await UserModel.findByIdAndUpdate(findUser._id, { token: createToken });

            const cookieExpireTime = 30 * 60 * 1000;
            res
                .cookie("userCookie", createToken, {
                    maxAge: cookieExpireTime,
                    httpOnlu: true,
                }).status(200).send({
                    process: true,
                    message: "Login Success!"
                })
        } else {
            throw new Error("Password is incorrect.");
        }

    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message
        });
    }
};

export const verificationUser = (req, res, next) => {
    try {
        const token = req.cookies.userCookie;
        if (!token) throw new Error("Token not found");

        const verifyToken = jwt.verify(token, process.env.secureToke);

        if (!verifyToken) throw new Error("Token is invalid.");

        req.verifyTokenId = verifyToken.id; 
        next();

    } catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
};

//verify user mate
export const verifyUser = async (req, res) => {
    try {
        const id = req.verifyTokenId;
        if (!id) throw new Error("User not verified.");

        const findUser = await UserModel.findById(id);
        res.status(200).send({
            process: true,
            message: "User verified!",
            userData: findUser,
        });

    } catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
};

export const userLogout = (req, res) => {
    res.clearCookie("userCookie");
    res.status(200).send({
        process: true,
        message: "Logout Successfully.",
    });
};

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.Email_User,
        pass: process.env.Email_Password
    }
})


const generateOTP = () => {
    return (Math.floor(100000 + Math.random() * 900000)).toString()
}

//Forget password
export const forgetPassword = async (req, res) => {
    try {
        const { email_id } = req.body

        if (!email_id) throw new Error("Email is requried.")

        const findUser = await UserModel.findOne({ email_id })
        if (!findUser) throw new Error("User not found.")

        const OTP = generateOTP()

        findUser.resetPasswordOtp = OTP
        findUser.resetPasswordExpires = Date.now() + 3600000


        await findUser.save()

        const mailOption = {
            to: email_id,
            from: process.env.Email_User,
            subject: "Password reset request.",
            text: `Your OTP for password reset is : ${OTP}`

        }

        transporter.sendMail(mailOption, (err) => {
            if (err) throw new Error("Error sending maill.")
            res.status(200).send({
                process: true,
                message: "OTP Sent To Your Email."
            })
        })
    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message
        })

    }
}

export const verifyOTP = async (req, res) => {
    try {
        const { email_id, otp } = req.body

        if (!email_id || !otp) throw new Error("All field are required.")

        const findEmail = await UserModel.findOne({ email_id })
        if (!findEmail) throw new Error("User not found.")

        if (
            findEmail.resetPasswordOtp !== otp || findEmail.resetPasswordExpires < Date.now()
        )

            throw new Error("OTP is invalid or expired.")

        res.status(200).send({
            process: true,
            message: "OTP Verified Successfully."
        })
    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message
        })

    }
}

//Reset password mate
export const resetPassword = async (req, res) => {
    try {
        const { email_id, newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) throw new Error("Password and confirmPassword does not match.");
        if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");

        const findUser = await UserModel.findOne({ email_id });
        if (!findUser) throw new Error("User not found.");

        // Hash the new password
        const hashPassword = await bcrypt.hash(newPassword, 10);
        findUser.password = hashPassword;

        await findUser.save();

        // Optional: Invalidate any old sessions or tokens here

        res.status(200).send({
            process: true,
            message: "Password reset successfully."
        });
    } catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
};

export const updatePassword = async (req, res) => {
    try {
        //const userId = req.verifyTokenId
        const { email_id, oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword)
            throw new Error("All fields are required.");

        const findUser = await UserModel.findOne({ email_id });
        if (!findUser) throw new Error("User not found.");

        const ismatch = await bcrypt.compare(oldPassword, findUser.password);
        if (!ismatch) throw new Error("Old Password is incorrect.");

        const hashNewPassword = await bcrypt.hash(newPassword, 10);
        findUser.password = hashNewPassword;
        await findUser.save();

        res.status(200).send({
            process: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.verifyTokenId
        const {
            fname,
            lname,
            username,
            email_id,
            password,
            confirmPassword,
        } = req.body


        const profileImg = req.file ? req.file.path : null

        if (password || confirmPassword) {
            if (password.length < 6) throw new Error("Password must be contain 6 characters")
            if (password !== confirmPassword) throw new Error("Password and confirm password do not match.")
            if (!/[a-z]/.test(password)) throw new Error("Password must be contain at least one lowercase")
            if (!/[A-Z]/.test(password)) throw new Error("Password must be contain at least one uppercase")
            if (!/[0-9]/.test(password)) throw new Error("Password must be contain at least one number")
            if (!/[^a-zA-Z0-9]/.test(password)) throw new Error("Password must be contain at least one special characters")
        }

        const userModel = await $UserModel.findById(userId)
        if (!userModel) throw new Error("user not found")

        const isDuplicateUser = await $UserModel.findOne({
            $or: [
                { email, _id: { $ne: userId } }, //include the current userid
                { username, _id: { $ne: userId } }
            ]
        });
        if (isDuplicateUser) throw new Error("Email or username is already in use.");

        user.fname = fname;
        user.lname = lname;
        user.username = username;
        user.email_id = email_id;

        if (profileImg) user.profileImg = profileImg;


        if (password) {
            const hashPassword = await bcrypt.hash(password, 10);
            user.password = hashPassword;
        }

        await user.save();

        res.status(200).send({
            process: true,
            message: "Profile Updated Successfully.",
            data: user
        })


    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message
        });
    }
}

export const getUser = async (req, res) => {
    try {
        const users = await UserModel.find({});
        res.send({ process: true, data: users });
    } catch (error) {
        res.status(500).send({ process: false, message: "Failed to fetch users" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const findUser = await UserModel.findByIdAndDelete(id);

        if (findUser) {
            res.status(200).send({
                process: true,
                message: "User deleted successfully.",
                data: findUser,
            });
        } else {
            throw new Error("User not found.");
        }
    } catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
};

export const addToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        const findUser = await UserModel.findById(userId);

        if (!findUser) throw new Error("User not found.");
        const addInWishlist = findUser.wishlist;

        if (addInWishlist.includes(productId))
            throw new Error("Product already added in wishlist.");
        addInWishlist.push(productId);

        const updateUser = await UserModel.findByIdAndUpdate(
            { _id: userId },
            { wishlist: addInWishlist }
        );

        console.log({ wishlist: addInWishlist });
        if (updateUser) {
            res.status(200).send({
                process: true,
                message: "Product added to wishlist successfully.",
            });
        }
    } catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
};

export const removeWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        const findUser = await UserModel.findById(userId);

        if (!findUser) throw new Error("User not found.");

        const updateStatus = await UserModel.findByIdAndUpdate(userId, {
            wishlist: findUser.wishlist.filter(
                (item) => item.toString() !== productId
            ),
        });

        if (updateStatus) {
            res.status(200).send({
                process: true,
                message: "Product removed from wishlist",
                data: findUser,
            });
        }
    } catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity = 1 } = req.body;

        const validQuantity = Number(quantity);

        if (isNaN(validQuantity) || validQuantity <= 0)
            throw new Error("Invalid quantity value.");

        const findUser = await UserModel.findById(userId);
        if (!findUser) throw new Error("User not found.");

        let userCart = await Cart.findOne({ userId });
        if (!userCart) {
            userCart = new Cart({
                userId,
                items: [],
                totalAmount: 0,

                discount: 0,
            });
        }

        const productIndex = userCart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (productIndex !== -1)
            throw new Error("Product already added to cart.")
        const product = await $productModel.findById(productId).select("discount");
        if (!product) throw new Error("Product not found.");

        const productPrice = Number(product.discount);
        if (isNaN(productPrice) || productPrice <= 0)
            throw new Error("Product price invalid.");

        if (productIndex !== -1) {
            userCart.items[productIndex].quantity += validQuantity;
            userCart.items[productIndex].subTotal = userCart.items[productIndex].quantity * productPrice;
        } else {
            userCart.items.push({
                productId,
                quantity: validQuantity,
                subTotal: validQuantity * productPrice,
            });
        }

        let subTotal = userCart.items.reduce((acc, item) => {
            const itemSubtotal = Number(item.subTotal);
            return isNaN(itemSubtotal) ? acc : acc + itemSubtotal;
        }, 0);


        userCart.totalAmount = subTotal - userCart.discount;

        userCart.totalAmount = isNaN(userCart.totalAmount)
            ? 0
            : userCart.totalAmount;
        await userCart.save();
        res.status(200).send({
            process: true,
            message: "Product added to cart successfully!",
            data: userCart,
        });

        console.log(userCart);
    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message,
        });
    }
};

export const getCartByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if the user exists
        const findUser = await UserModel.findById(userId);
        if (!findUser) throw new Error("User not found.");

        // Fetch the user's cart
        const userCart = await Cart.findOne({ userId });
        if (!userCart) {
            throw new Error("Cart not found.");
        }

        res.status(200).send({
            process: true,
            message: "Cart fetched successfully!",
            data: userCart,
        });
    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message,
        });
    }
};

export const updateCart = async (req, res) => {
    try {
        const { userId, items } = req.body;

        // Find the user's cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found." });
        }

        // Recalculate subtotal and total
        let subtotal = 0;
        const updatedItems = [];

        for (const item of items) {
            const product = await $ProductModel
                .findById(item.productId)
                .select("discount");
            if (!product) throw new Error("Product not found.");

            const productPrice = Number(product.discount);
            if (isNaN(productPrice) || productPrice <= 0)
                throw new Error("Product price invalid.");

            const itemSubTotal = item.quantity * productPrice;
            updatedItems.push({ ...item, subTotal: itemSubTotal });
            subtotal += itemSubTotal;

            // Debugging logs
            console.log("Product price:", productPrice);
            console.log("Item subtotal:", itemSubTotal);
        }


        const grandTotal = subtotal;

        // Update cart details
        cart.items = updatedItems;
        cart.subtotal = subtotal;
        // cart.shippingCost = shippingCost;
        cart.totalAmount = grandTotal;

        // Debugging log
        console.log("Updated cart before saving:", cart);

        // Save updated cart
        await cart.save();

        res.status(200).json({
            process: true,
            message: "Cart updated successfully!",
            data: cart,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const clearCart = async (req, res) => {
    try {
        const { userId } = req.params;

        let cart = await Cart.findOne({ userId });

        if (!cart) throw new Error("Cart not found.");

        cart.items = [];
        cart.totalAmount = 0;
        // cart.shippingCost = 0;
        cart.subtotal = 0;

        await cart.save();

        res.status(200).send({
            process: true,
            message: "Cart cleared successfully.",
        });
    } catch (error) {
        res.status(500).send({
            process: false,
            message: error.message,
        });
    }
};

export const removeProductFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.params;

        let cart = await Cart.findOne({ userId });

        if (!cart) throw new Error("Cart not found.");

        // Remove the product from the cart
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        // Recalculate totals after removal
        cart.totalAmount = cart.items.reduce((acc, item) => acc + item.subTotal, 0);

        cart.subtotal = cart.totalAmount;

        await cart.save();

        res.status(200).send({
            process: true,
            message: "Product removed from cart successfully.",
            cart,
        });
    } catch (error) {
        res.status(500).send({
            process: false,
            message: error.message,
        });
    }
};
