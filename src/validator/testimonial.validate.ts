import Joi from "joi";

export const createTestimonialSchema = Joi.object({
    reviewerName: Joi.string().trim().min(2).max(100).required().messages({
        "any.required": "Reviewer name is required",
    }),
    reviewerCountry: Joi.string().trim().min(2).max(100).required().messages({
        "any.required": "Reviewer country is required",
    }),
    rating: Joi.number().min(1).max(5).required().messages({
        "number.min": "Rating must be between 1 and 5",
        "number.max": "Rating must be between 1 and 5",
        "any.required": "Rating is required",
    }),
    title: Joi.string().trim().min(3).max(150).required().messages({
        "any.required": "Title is required",
    }),
    body: Joi.string().trim().min(10).max(1000).required().messages({
        "any.required": "Review body is required",
    }),
    package: Joi.string().hex().length(24).allow("", null).optional().messages({
        "string.length": "Package must be a valid ID",
    }),
    order: Joi.number().integer().min(0),
    isActive: Joi.boolean().default(true),
});

export const updateTestimonialSchema = Joi.object({
    reviewerName: Joi.string().trim().min(2).max(100),
    reviewerCountry: Joi.string().trim().min(2).max(100),
    rating: Joi.number().min(1).max(5),
    title: Joi.string().trim().min(3).max(150),
    body: Joi.string().trim().min(10).max(1000),
    package: Joi.string().hex().length(24).allow("", null).optional(),
    order: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean(),
}).min(1);