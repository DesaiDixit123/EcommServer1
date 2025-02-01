import mongoose from "mongoose";
import { categoryModel } from "../models/categoryModel.js";
import e from "express";

export const categories = async (req, res) => {
    try {
        const { categoryname, fields } = req.body;

        // check if categoryname is provided
        if (!categoryname) throw new Error("Enter the category.");

        // check if fields is provided and is a non-empty array
        if (!fields || !Array.isArray(fields) || fields.length === 0){
            throw new Error ("Enter the fields.");
        }

        const category = await categoryModel.findOne({ categoryname });

        if (category) {
            const uniqueFields = Array.from(new Set([...category.fields, ...fields]));
            category.fields = uniqueFields;
            const updatecategory = await category.save();
            res.status(200).send({
                process: true,
                message:"category updated successfully.",
                data: updateCategory,

            });
        }else{
            const response = await categoryModel({ categoryname, fields }).save();
            res.status(200).send({
                process: true,
                message: "Category added.",
                data: response,
            });
        }

    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message,
        });
    }
};


export const getAllCategory = async(req, res) => {
    res.send(await categoryModel.find({}));
};

export const getFieldsForcategory = async(req, res) => {
    try{
        const { categoryname } = req.params;

        if (!categoryname) throw new Error ("Category name is required.");

        const category = await categoryModel.findOne({ categoryname });

        if (!category) throw new Error("Category not found.");

        res.status(200).send({
            success: true,
            fields: category.fields,
        });
    }catch (error) {
        res. status(400).send({
            success: false,
            message: error.message,
        });
    }
};



export const deleteCategory = async(req, res) => {
    try {
        const { id } = req.params;

        const findCategory = await categoryModel.findByIdAndDelete(id);

        if(findCategory) {
            res.status(200).send({
                process: true,
                message: "Category deleted successfully.",
                data: findCategory,
            });
        }else{
            throw new Error("Category not found.");
        }
    }catch (error) {
        res.status(201).send({
            process: false,
            message: error.message,
        });
    }
};


export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryname, fields } = req.body;

        //check if the category exists
        const category = await categoryModel.findById(id);
        if(!category) throw new Error("Category not found.");

        //Updare category name if provided
        if (categoryname) {
            category.categoryname = categoryname;
        }

        //update fields by adding new fields and removing deleted ones
        if (Array.isArray(fields)) {
            // REmove fields that are no longer in the update fields array
            const updatedFields = fields.filter(field => !category.fields.includes(field));

            //Add new fields
            category.fields = [...new Set([...category.fields, ...updatedFields])];
        }

        const updateCategory = await category.save();
        res.status(200).send({
            process: true,
            message: "category updated successfully.",
            data: updateCategory,
        });
    } catch (error) {
        res.status(400).send({
            process: false,
            message: error.message,
        });
    }
};


export const deleteFieldFromCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { fieldToRemove } = req.body;
  
      if (!fieldToRemove) throw new Error("Field to remove is required.");
  
      // Ensure the id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid category ID.");
      }
  
      const category = await categoryModel.findById(id);
      if (!category) throw new Error("Category not found.");
  
      // Remove the field
      category.fields = category.fields.filter(field => field !== fieldToRemove);
  
      const updatedCategory = await category.save();
      res.status(200).send({
        process: true,
        message: "Field removed successfully.",
        data: updatedCategory,
      });
    } catch (error) {
      res.status(400).send({
        process: false,
        message: error.message,
      });
    }
  };