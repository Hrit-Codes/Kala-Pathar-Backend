import Joi from "joi";

export const createGallerySchema = Joi.object({
  subtitle: Joi.string().trim().min(2).required(),
  title: Joi.string().trim().min(2).required(),
  description: Joi.string().trim().min(10).required(),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean().optional(),
});

export const updateGallerySchema = Joi.object({
  subtitle: Joi.string().trim().min(2),
  title: Joi.string().trim().min(2),
  description: Joi.string().trim().min(10),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean().optional(),
}).min(1);