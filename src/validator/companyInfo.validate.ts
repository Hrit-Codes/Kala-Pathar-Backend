import Joi from "joi";

export const createCompanyInfoSchema = Joi.object({
  companyName: Joi.string().trim().min(2).required(),
  officeAddress: Joi.string().trim().min(5).required(),
  officeTelephone: Joi.string().trim().required(),
  emails: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().email()).min(1).max(3),
      Joi.string() 
    )
    .required(),
  phones: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()).min(1).max(2),
      Joi.string()
    )
    .required(),
  description: Joi.string().trim().allow(""),
  socialLinks: Joi.alternatives().try(
    Joi.object({
      facebook: Joi.string().uri().allow(""),
      instagram: Joi.string().uri().allow(""),
      linkedin: Joi.string().uri().allow(""),
      twitter: Joi.string().uri().allow(""),
      youtube: Joi.string().uri().allow(""),
      tiktok: Joi.string().uri().allow(""),
    }),
    Joi.string()
  ),
});

export const updateCompanyInfoSchema = Joi.object({
  companyName: Joi.string().trim().min(2),
  officeAddress: Joi.string().trim().min(5),
  officeTelephone: Joi.string().trim(),
  emails: Joi.alternatives().try(
    Joi.array().items(Joi.string().email()).min(1).max(3),
    Joi.string()
  ),
  phones: Joi.alternatives().try(
    Joi.array().items(Joi.string()).min(1).max(2),
    Joi.string()
  ),
  description: Joi.string().trim().allow(""),
  socialLinks: Joi.alternatives().try(Joi.object(), Joi.string()),
}).min(1); 