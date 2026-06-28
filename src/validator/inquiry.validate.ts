import Joi from "joi";

export const createInquirySchema = Joi.object({
    fullname: Joi.string().trim().min(2).max(100).required().messages({
        "string.min": "Full name must be at least 2 characters",
        "string.max": "Full name must be at most 100 characters",
        "any.required": "Full name is required",
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
        "string.email": "Invalid email address",
        "any.required": "Email is required",
    }),
    phone: Joi.string().trim().min(7).max(20).required().messages({
        "string.min": "Phone number must be at least 7 characters",
        "string.max": "Phone number must be at most 20 characters",
        "any.required": "Phone number is required",
    }),
    subject: Joi.string().trim().min(3).max(150).required().messages({
        "string.min": "Subject must be at least 3 characters",
        "string.max": "Subject must be at most 150 characters",
        "any.required": "Subject is required",
    }),
    description: Joi.string().trim().min(10).max(1000).required().messages({
        "string.min": "Description must be at least 10 characters",
        "string.max": "Description must be at most 1000 characters",
        "any.required": "Description is required",
    }),
});

export const replyToInquirySchema=Joi.object({
    message:Joi.string().trim().min(10).max(1000).required(),
})