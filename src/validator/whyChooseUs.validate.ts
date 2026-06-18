import Joi from "joi";

export const createWhyChooseUsSchema= Joi.object({
    title:Joi.string().trim().min(3).max(100).required(),
    description:Joi.string().trim().min(10).max(500).required(),
    icon:Joi.string().trim().required(),
    order:Joi.number().integer().min(0).optional(),
    isActive:Joi.boolean().optional()
})

export const updateWhyChooseUsSchema=Joi.object({
    title:Joi.string().trim().min(3).max(100).optional(),
    description:Joi.string().trim().min(10).max(500).optional(),
    icon:Joi.string().trim().optional(),
    order:Joi.number().integer().min(0).optional(),
    isActive:Joi.boolean().optional()
}).min(1); // At least one field is required