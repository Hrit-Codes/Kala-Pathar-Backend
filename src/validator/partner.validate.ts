import Joi from "joi";

export const createPartnerSectionSchema = Joi.object({
    sectionTitle: Joi.string().trim().min(2).required(),
    sectionTagline: Joi.string().trim().min(2).required(),
    badges: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim()).min(2).max(6),
        Joi.string()
    ),
});

export const updatePartnerSectionSchema = Joi.object({
    sectionTitle: Joi.string().trim().min(2),
    sectionTagline: Joi.string().trim().min(2),
    badges: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim()).min(2).max(6),
        Joi.string()
    ),
}).min(1);

export const addAffiliationSchema = Joi.object({
    abbreviation: Joi.string().trim().min(1).max(10).required(),
    name: Joi.string().trim().min(2).required(),
    order: Joi.number().integer().min(0),
});

export const updateAffiliationSchema = Joi.object({
    abbreviation: Joi.string().trim().min(1).max(10),
    name: Joi.string().trim().min(2),
    order: Joi.number().integer().min(0),
});