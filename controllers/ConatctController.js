import { conatctModel } from "../models/ContactModel.js";

export const contact = async (req, res) => {
  try {
    const { name, ConatctNo, email, message } = req.body;

    if (!name || !ConatctNo || !email || !message)
      throw new Error("All Fields Are Requrie.");

    const existingContact = await conatctModel.findOne({
      $or: [{ email }, { ConatctNo }],
    });

    if (existingContact) throw new Error("You have already contacted us.");
    const contact = new conatctModel({
      name,
      ConatctNo,
      email,
      message,
    });

    await contact.save();

    res.status(200).send({
      process: true,
      message: "Contact form submitted successfully.",
      data: contact,
    });
  } catch (error) {
    res.status(201).send({
      process: false,
      message: error.message,
    });
  }
};

export const getContacts = async (req, res) => {
  try {
    const { sort } = req.query;
    let sortQuery = {};
    let sortOrder = { createdAt: -1 };
    if (sort === "daily") {
      sortQuery = {
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      };
    } else if (sort === "monthly") {
      sortQuery = {
        createdAt: {
          $gte: new Date(new Date().setDate(1)),
        },
      };
    } else if (sort === "yearly") {
      sortQuery = {
        createdAt: {
          $gte: new Date(new Date().setMonth(0, 1)),
        },
      };
    }else if (sort === "latest") {
      sortOrder = { createdAt: -1 }; 
    }
    const findContact = await conatctModel
      .find(sortQuery)
      .sort(sortOrder);
    res.status(200).send({
      process: true,
      message: "contact fetch successfully.",
      data: findContact,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const findContact = await conatctModel.findByIdAndDelete(contactId);

    if (!findContact) throw new Error("Contact not found.");

    res.status(200).send({
      process: true,
      message: "Contact deleted successfully.",
      data: findContact, // This will be the deleted contact's data
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
