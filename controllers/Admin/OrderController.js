import { City, Country, State } from "country-state-city";
import isEmail from "validator/lib/isEmail.js";

import nodemailer from "nodemailer";
import crypto from "crypto";
import { Order } from "../../models/OrderModel.js";

export const getAllCountries = async (req, res) => {
  try {
    const country = Country.getAllCountries();

    res.status(200).send({
      process: true,
      message: "Country retrieved successfully.",
      data: country,
    });
  } catch (error) {
    res.status(201).send({
      process: false,
      message: error.message,
    });
  }
};

export const getStatesByCountry = (req, res) => {
  try {
    const { countryCode } = req.params;
    const states = State.getStatesOfCountry(countryCode);

    res.status(200).send({
      process: true,
      message: `States of ${countryCode} retrieved successfully.`,
      data: states,
    });
  } catch (error) {
    res.status(201).send({
      process: false,
      message: error.message,
    });
  }
};

export const getCitiesByState = (req, res) => {
  try {
    const { countryCode, stateCode } = req.params;

    const cities = City.getCitiesOfState(countryCode, stateCode);

    res.status(200).send({
      process: true,
      message: `Cities of ${stateCode} , ${countryCode} retrieved successfully.`,
      data: cities,
    });
  } catch (error) {
    res.status(201).send({
      process: false,
      message: error.message,
    });
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Password,
  },
});

const sendOrderConfirmationEmail = async (userEmail, order) => {
  try {
    const mailOptions = {
      from: process.env.Email_User,
      to: userEmail,
      subject: "Order Confirmation",
      text: ` Dear ${order.shippingAddress.fname} ${
        order.shippingAddress.lname
      } 
      
      Thank you for your order!

      Order ID : ${order.orderNumber}
      Order Items : ${order.orderItems
        .map((item) => `${item.title} x ${item.quantity}`)
        .join(", ")}
      Shipping Address : ${order.shippingAddress.addressLine1},${
        order.shippingAddress.city
      },${order.shippingAddress.state},${order.shippingAddress.city},${
        order.shippingAddress.country
      },${order.shippingAddress.zipCode}
      
        Payment Method : ${order.paymentMethod}
        Total Price : ${order.totalPrice}

         We will notify you once your order is shipped.

         Best Regards,
         Ecommerce
      
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending email : ", error);
  }
};

const generateRandomId = () => {
  return crypto.randomBytes(12).toString("hex");
};
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};
export const placeOrder = async (req, res) => {
  try {
    const {
      userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentResult = {},
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).send({
        process: false,
        message: "No order items provided.",
      });
    }

    if (!isEmail(shippingAddress.email_id)) {
      return res.status(400).send({
        process: false,
        message: "Invalid email format.",
      });
    }

    if (!shippingAddress || !shippingAddress.mobileNo) {
      return res.status(400).send({
        process: false,
        message: "Mobile number is required in shipping address.",
      });
    }

    if (!/^\d{10}$/.test(shippingAddress.mobileNo)) {
      return res.status(400).send({
        process: false,
        message: "Invalid mobile number. It should be 10 digits.",
      });
    }

    if (!/^\d{6}$/.test(shippingAddress.zipCode)) {
      return res.status(400).send({
        process: false,
        message: "Invalid zipcode. It should be 6 digits.",
      });
    }

    const country = Country.getCountryByCode(shippingAddress.country);
    if (!country) {
      return res.status(400).send({
        process: false,
        message: "Invalid country selected.",
      });
    }

    const state = State.getStateByCodeAndCountry(
      shippingAddress.state,
      shippingAddress.country
    );
    if (!state) {
      return res.status(400).send({
        process: false,
        message: "Invalid state selected.",
      });
    }

    const cities = City.getCitiesOfState(
      shippingAddress.country,
      shippingAddress.state
    );
    const city = cities.find((c) => c.name === shippingAddress.city);
    if (!city) {
      return res.status(400).send({
        process: false,
        message: "Invalid city selected.",
      });
    }

    if (typeof shippingPrice !== "number" || shippingPrice < 0) {
      return res.status(400).send({
        process: false,
        message: "Invalid shipping price. It should be a non-negative number.",
      });
    }

    let isPaid = false;
    let paidAt = null;

    if (paymentMethod === "CreditCard/DebitCard") {
      if (!paymentResult || paymentResult.status !== "success") {
        return res.status(400).send({
          process: false,
          message: "Payment failed or not completed.",
        });
      }
      isPaid = true;
      paidAt = new Date(paymentResult.update_time);
    } else if (paymentMethod === "COD") {
      paymentResult.status = "Pending";
      paymentResult.id = generateRandomId();
      paymentResult.update_time = paidAt;
      paymentResult.email_address = shippingAddress.email_id;
    }

    const OrderNumber = generateOrderNumber();
    const order = new Order({
      userId,
      orderItems,
      shippingAddress: {
        ...shippingAddress,
        country: country.name,
        state: state.name,
        city: city.name,
      },
      paymentMethod,
      orderNumber: OrderNumber,
      paymentResult,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid,
      paidAt,
      isDelivered: false,
    });

    const createOrder = await order.save();
    await sendOrderConfirmationEmail(shippingAddress.email_id, createOrder);

    res.status(200).send({
      process: true,
      message: "Order placed successfully.",
      data: {
        _id: createOrder._id,
        createOrder,
      },
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).send({
      process: false,
      message: "Internal server error.",
    });
  }
};

export const getAllOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const userOrder = await Order.find({ userId });

    if (!userOrder) throw new Error("Order not found.");
    res.status(200).send({
      process: true,
      message: "Orders fetch successfully.",
      data: userOrder,
    });
  } catch (error) {
    res.status(201).send({
      process: false,
      message: error.message,
    });
  }
};
const sendOrderCancellationEmail = async (userEmail, order) => {
  try {
    const mailOptions = {
      from: process.env.Email_User,
      to: userEmail,
      subject: "Order Cancellation Confirmation",
      text: `Dear ${order.shippingAddress.fname} ${order.shippingAddress.lname},

We regret to inform you that your order with Order ID: ${order.orderNumber} has been cancelled.

Cancellation Reason: ${order.cancelReason}
Cancellation Comment: ${order.cancelComment}

Order Items: ${order.orderItems
        .map((item) => `${item.title} x ${item.quantity}`)
        .join(", ")}
Shipping Address: ${order.shippingAddress.addressLine1}, ${
        order.shippingAddress.city
      }, ${order.shippingAddress.state}, ${order.shippingAddress.city}, ${
        order.shippingAddress.country
      }, ${order.shippingAddress.zipCode}

If you have any further questions or concerns, please feel free to reach out to us.

Best Regards,
Ecommerce Support Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Cancellation email sent successfully.");
  } catch (error) {
    console.log("Error sending cancellation email:", error);
  }
};

export const orderCancel = async (req, res) => {
  try {
    const { userId, orderId, orderNumber } = req.params;
    const { reason	, comment	 } = req.body;

    const validReasons = [
      "Found a better price elsewhere.",
      "Change of mind.",
      "Delivery took too long.",
      "Order placed by mistake.",
    ];

    if (!validReasons.includes(reason))
      throw new Error("Invalid cancellation reason provided.");

    const order = await Order.findOne({ _id: orderId, userId, orderNumber });

    if (!order)
      throw new Error(
        "Order not found or you do not have permission to cancel this order."
      );

    if (order.isCancelled) throw new Error("Order is already cancelled");

    order.isCancelled = true;
    order.cancelReason = reason;
    order.cancelComment = comment;
   
    if (order.paymentResult) {
      if (order.paymentResult.status === "success") {
        order.paymentResult.status = "Cancelled";
        order.paymentResult.cancelledAt = new Date();
      } else if (order.paymentResult.status === "Pending") {
        order.paymentResult.status = "Cancelled";
        order.paymentResult.cancelledAt = new Date();
      }
    }

    await order.save();
    await sendOrderCancellationEmail(order.shippingAddress.email_id, order);
    res.status(200).send({
      process: true,
      message: "Order cancelled successfully.",
      data: order, // Return updated order with cancellation info
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  res.send(await Order.find({}));
};
export const orderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    let { orderStatus } = req.body; // Get the order status from the request body

    const validStatus = ["Pending", "Processing", "Shipped", "Deliverd", "Canceled"];

    // Log the received status for debugging
    console.log("Received order status:", orderStatus);

    // Trim spaces and check if the status is valid
    orderStatus = orderStatus.trim();
    if (!validStatus.includes(orderStatus)) {
      throw new Error("Invalid status provided.");
    }

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found.");

    // Update the order status
    order.orderStatus = orderStatus;

    // Update the status history
    if (order.statusHistory.length > 0) {
      const lastEntry = order.statusHistory[order.statusHistory.length - 1];
      lastEntry.status = orderStatus;
      lastEntry.date = new Date();
    } else {
      order.statusHistory.push({
        status: orderStatus,
        date: new Date()
      });
    }

    // If the order status is "Delivered", update paymentResult.status to "Completed"
    if (orderStatus === "Deliverd") {
      order.isDelivered = true;
      order.deliveredAt = new Date();

      // Ensure that paymentResult.status is updated to "Completed"
      if (order.paymentResult.status !== "Completed") {
        order.paymentResult.status = "Completed"; // Update the payment status
        order.paymentResult.update_time = new Date().toISOString(); // Update the time
        order.markModified("paymentResult"); // Explicitly mark the paymentResult field as modified
      }
    }

    // If the order status is "Canceled", mark the order as canceled
    if (orderStatus === "Canceled") {
      order.isCancelled = true;
      order.cancelledAt = new Date();

      if (order.paymentResult.status !== "Canceled") {
        order.paymentResult.status = "Canceled"; // Update the payment status
        order.paymentResult.update_time = new Date().toISOString(); // Update the time
        order.markModified("paymentResult"); // Explicitly mark the paymentResult field as modified
      }
    }

    // Save the updated order
    await order.save();

    // Respond with success
    res.status(200).send({
      process: true,
      message: "Order status updated successfully.",
      data: order,
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send({
      process: false,
      message: error.message,
    });
  }
};
