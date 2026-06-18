import Joi from "joi";

const ceoQuoteJoiSchema = Joi.object({
  quoteText: Joi.string().trim().min(20).required(),
  ceoName: Joi.string().trim().min(4).required(),
  ceoTitle: Joi.string().trim().min(2).required(),
});

const statJoiSchema = Joi.object({
  label: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
});

export const createAboutUsSchema = Joi.object({
  heading: Joi.string().trim().min(2).required(),
  tagline: Joi.string().trim().min(5).required(),
  description: Joi.string().trim().min(10).required(),
  ceoQuote: Joi.alternatives()
    .try(ceoQuoteJoiSchema, Joi.string())
    .required(),
  stats: Joi.alternatives()
    .try(Joi.array().items(statJoiSchema).length(4), Joi.string())
    .required(),
});

export const updateAboutUsSchema = Joi.object({
  heading: Joi.string().trim().min(2),
  tagline: Joi.string().trim().min(5),
  description: Joi.string().trim().min(10),
  ceoQuote: Joi.alternatives().try(
    ceoQuoteJoiSchema.fork(["quoteText", "ceoName", "ceoTitle"], (s) => s.optional()),
    Joi.string()
  ),
  stats: Joi.alternatives().try(Joi.array().items(statJoiSchema).length(4), Joi.string()),
}).min(1);