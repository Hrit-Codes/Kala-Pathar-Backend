import Joi from "joi";

export const createHeroSectionSchema = Joi.object({
    eyebrow: Joi.string().trim().min(2).max(100).required().messages({
        "string.min": "Eyebrow text must be at least 2 characters",
        "string.max": "Eyebrow text must be at most 100 characters",
        "any.required": "Eyebrow text is required",
    }),
    brandName: Joi.string().trim().min(2).max(100).required().messages({
        "any.required": "Brand name is required",
    }),
    headingLine1: Joi.string().trim().min(2).max(100).required().messages({
        "any.required": "Heading line 1 is required",
    }),
    headingLine2: Joi.string().trim().min(2).max(100).required().messages({
        "any.required": "Heading line 2 is required",
    }),
    description: Joi.string().trim().min(10).max(500).required().messages({
        "string.min": "Description must be at least 10 characters",
        "any.required": "Description is required",
    }),
    primaryButtonText: Joi.string().trim().min(2).max(50).required().messages({
        "any.required": "Primary button text is required",
    }),
    primaryButtonLink: Joi.string().trim().required().messages({
        "any.required": "Primary button link is required",
    }),
    secondaryButtonText: Joi.string().trim().min(2).max(50).required().messages({
        "any.required": "Secondary button text is required",
    }),
    secondaryButtonLink: Joi.string().trim().allow("").optional(),
    mediaType: Joi.string().valid("image", "video").required().messages({
        "any.only": "Media type must be either 'image' or 'video'",
        "any.required": "Media type is required",
    }),
    textAlignment: Joi.string().valid("left", "center", "right").default("left").messages({
        "any.only": "Text alignment must be left, center, or right",
    }),
    overlayColor: Joi.string()
        .trim()
        .pattern(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
        .default("#000000")
        .messages({
            "string.pattern.base": "Overlay color must be a valid hex code e.g. #000000",
        }),
    overlayOpacity: Joi.number().min(0).max(100).default(40).messages({
        "number.min": "Opacity must be between 0 and 100",
        "number.max": "Opacity must be between 0 and 100",
    }),
    isActive: Joi.alternatives().try(Joi.boolean(), Joi.string()).default(true),
    order: Joi.number().integer().min(0).default(0),
});

export const updateHeroSectionSchema = Joi.object({
    eyebrow: Joi.string().trim().min(2).max(100),
    brandName: Joi.string().trim().min(2).max(100),
    headingLine1: Joi.string().trim().min(2).max(100),
    headingLine2: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().min(10).max(500),
    primaryButtonText: Joi.string().trim().min(2).max(50),
    primaryButtonLink: Joi.string().trim(),
    secondaryButtonText: Joi.string().trim().min(2).max(50),
    secondaryButtonLink: Joi.string().trim().allow(""),
    mediaType: Joi.string().valid("image", "video"),
    textAlignment: Joi.string().valid("left", "center", "right"),
    overlayColor: Joi.string()
        .trim()
        .pattern(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
        .messages({
            "string.pattern.base": "Overlay color must be a valid hex code e.g. #000000",
        }),
    overlayOpacity: Joi.number().min(0).max(100),
    isActive: Joi.alternatives().try(Joi.boolean(), Joi.string()),
    order: Joi.number().integer().min(0),
}).min(1);