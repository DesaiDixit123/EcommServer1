import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import {UserModel} from "../../models/userModel.js";
dotenv.config

export const adminLogin = async(req, res) => {
    try {
        const { identifiers, password } = req.body;

        if (!identifiers) throw new Error("Username/Emai Requrid");
        if (!password) throw new Error("Password is requried.");

        const findAdmin = await UserModel.findOne({
            $or: [{ email_id: identifiers}, { username: identifiers}],
        });

        if (!findAdmin) throw new Error("Admin not found.");
        if (!findAdmin.isAdmin) throw new Error("You are not Admin.");

        const checkPassword = await bcrypt.compare(password, findAdmin.password);

        if (checkPassword) {
            const createToken = jwt.sign(
                { id: findAdmin._id },
                process.env.secureTokenAdmin,
                { expiresIn: "30m" }
            );
            await UserModel.findByIdAndUpdate(findAdmin._id, { token: createToken,

             });

             const cookieExpireTime = 30 * 60 * 1000;
            res
                .cookie("adminCookie", createToken, {
                    maxAge: cookieExpireTime,
                    httpOnlu: true,
                })
                .status(200).send({
                    process: true,
                    message: "Login Success!",
                    data: findAdmin
                });
        } else {
            throw new Error("Password is incorrect.");
        }
    }catch (error) {
        res.status(400).send({
            process: false,
            message: error.message
        });
    }
}


export const adminverification= (req, res, next) => {
    try {
        const token = req.cookies.adminCookie;
        if (!token) throw new Error("Token not found");

        const verifyToken = jwt.verify(token, process.env.secureTokenAdmin);
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

export const verifyAdmin = async (req, res) => {
    try {
        const id = req.verifyTokenId;
        if (!id) throw new Error("User not verified.");

        const findAdmin = await UserModel.findById(id);
        res.status(200).send({
            process: true,
            message: "Admin verified!",
            userData: findAdmin,
        })
    } catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
};

export const adminLogout = (req, res) => {
    res.clearCookie("adminCookie");
    res.status(200).send({
        process: true,
        message: "Admin Logout Successfully.",
    });
};
    