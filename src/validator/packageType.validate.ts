import Joi from "joi";

export const createPackageTypeSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    icon: Joi.string().trim().min(1).required(),
    themeColor: Joi.string()
        .trim()
        .pattern(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
        .required()
        .messages({
            "string.pattern.base": "Theme color must be a valid hex color (e.g. #10B981)",
        }),
    description: Joi.string().trim().max(500).allow(""),
    hasDifficultyLevels: Joi.boolean().default(false),
    order: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
});

export const updatePackageTypeSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    icon: Joi.string().trim().min(1),
    themeColor: Joi.string()
        .trim()
        .pattern(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
        .messages({
            "string.pattern.base": "Theme color must be a valid hex color (e.g. #10B981)",
        }),
    description: Joi.string().trim().max(500).allow(""),
    hasDifficultyLevels: Joi.boolean(),
    order: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
}).min(1);