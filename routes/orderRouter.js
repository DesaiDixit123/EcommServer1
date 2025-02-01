import { Router } from "express";
import { verificationUser } from "../controllers/userController.js";
import { getAllCountries, getAllOrders, getAllOrdersByUserId, getCitiesByState, getStatesByCountry, orderCancel, orderStatus, placeOrder } from "../controllers/Admin/OrderController.js";
/* import { getAllCountries, getAllOrders, getAllOrdersByUserId, getCitiesByState, getStatesByCountry, orderCancel, orderStatus, placeOrder } from "../controllers/OrderController.js";
import { veriFicationUser } from "../controllers/userController.js"; */


export const OrderRouetr=Router()

OrderRouetr.post("/placeOrder",verificationUser,placeOrder)
OrderRouetr.get("/countries",getAllCountries)
OrderRouetr.get("/orders",getAllOrders)
OrderRouetr.get("/states/:countryCode",getStatesByCountry)
OrderRouetr.get("/cities/:stateCode/:countryCode",getCitiesByState)
OrderRouetr.get("/order/:userId",verificationUser,getAllOrdersByUserId)
OrderRouetr.patch("/order/cancel/:userId/:orderId/:orderNumber",verificationUser,orderCancel)
OrderRouetr.put("/orderStatus/:orderId",orderStatus)