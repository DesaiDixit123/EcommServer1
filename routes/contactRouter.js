import { Router } from "express";
import { contact, deleteContact, getContacts } from "../controllers/ConatctController.js";

export const ContactRouter=Router()

ContactRouter.post("/contact",contact)
ContactRouter.get("/get/contact",getContacts)
ContactRouter.delete("/contact/:contactId",deleteContact)