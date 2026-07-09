import Joi from "joi";

export const createDestinationSchema = Joi.object({
  name: Joi.string().trim().min(2).required().messages({
    "string.empty": "Destination name is required",
    "any.required": "Destination name is required",
  }),
  description: Joi.string().trim().min(10).max(1000).required(),
  order: Joi.number().integer().min(1).default(1),
  isActive: Joi.boolean().default(true),
});

export const updateDestinationSchema = Joi.object({
  name: Joi.string().trim().min(2),
  description: Joi.string().trim().min(10).max(1000),
  order: Joi.number().integer().min(1),
  isActive: Joi.boolean(),
}).min(1); // Ensures that at least one field is provided when updating