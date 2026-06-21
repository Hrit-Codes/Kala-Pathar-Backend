import Joi from "joi";
import { DIFFICULTY_NAMES } from "../constants/difficulty";
import { CURRENCIES, PRICE_LABELS } from "../model/package.model";

const supportContactJoi = Joi.object({
    name: Joi.string().trim().required(),
    phone: Joi.string().trim().required(),
});

const itineraryDayJoi = Joi.object({
    day: Joi.number().integer().min(1).required(),
    title: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
});

const termsAndConditionsJoi = Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    isRequired: Joi.boolean(),
});

const faqJoi = Joi.object({
    question: Joi.string().trim().required(),
    answer: Joi.string().trim().required(),
    order: Joi.number().integer().min(0),
});

const faqSectionJoi = Joi.object({
    title: Joi.string().trim().default("FAQs"),
    description: Joi.string().trim().default("Everything you need to know about this tour before you book"),
    faqs: Joi.array().items(faqJoi).min(2).required()
        .messages({ "array.min": "At least 2 FAQs are required" }),
});

export const createTravelPackageSchema = Joi.object({
    title: Joi.string().trim().min(3).required(),
    badge: Joi.string().trim().allow(""),
    overviewTitle: Joi.string().trim().allow("").required(),
    description: Joi.string().trim().min(10).required(),
    price: Joi.number().min(0).required(),
    currency: Joi.string().valid(...CURRENCIES).default("Rs"),
    priceLabel: Joi.string().valid(...PRICE_LABELS).default("per person"),
    durationDays: Joi.number().integer().min(1).required(),
    maxAltitude: Joi.string().trim().allow(""),
    difficulty: Joi.string().valid(...DIFFICULTY_NAMES),
    groupSize: Joi.number().integer().min(1),
    highlights: Joi.alternatives()
        .try(Joi.array().items(Joi.string()).min(2), Joi.string())
        .required()
        .messages({ "array.min": "At least 2 highlights are required" }),
    inclusions: Joi.alternatives()
        .try(Joi.array().items(Joi.string()).min(2), Joi.string())
        .required()
        .messages({ "array.min": "At least 2 inclusions are required" }),
    exclusions: Joi.alternatives()
        .try(Joi.array().items(Joi.string()).min(2), Joi.string()),
    itinerary: Joi.alternatives()
        .try(Joi.array().items(itineraryDayJoi), Joi.string()),
    supportContacts: Joi.alternatives()
        .try(Joi.array().items(supportContactJoi).min(2), Joi.string())
        .required()
        .messages({ "array.min": "At least 2 support contacts are required" }),
    termsAndConditions: Joi.alternatives()
        .try(Joi.array().items(termsAndConditionsJoi).min(2), Joi.string())
        .required()
        .messages({ "array.min": "At least 2 terms and conditions are required" }),
    faqSection: Joi.alternatives()
        .try(faqSectionJoi, Joi.string())
        .required(),
    packageType: Joi.string().required(),
    destination: Joi.string().required(),
    isFeatured: Joi.alternatives().try(Joi.boolean(), Joi.string()),
    isActive: Joi.alternatives().try(Joi.boolean(), Joi.string()),
});

export const updateTravelPackageSchema = Joi.object({
    title: Joi.string().trim().min(3),
    badge: Joi.string().trim().allow(""),
    overviewTitle: Joi.string().trim().allow(""),
    description: Joi.string().trim().min(10),
    price: Joi.number().min(0),
    currency: Joi.string().valid(...CURRENCIES),
    priceLabel: Joi.string().valid(...PRICE_LABELS),
    durationDays: Joi.number().integer().min(1),
    maxAltitude: Joi.string().trim().allow(""),
    difficulty: Joi.string().valid(...DIFFICULTY_NAMES),
    groupSize: Joi.number().integer().min(1),
    highlights: Joi.alternatives()
        .try(Joi.array().items(Joi.string()).min(2), Joi.string()),
    inclusions: Joi.alternatives()
        .try(Joi.array().items(Joi.string()).min(2), Joi.string()),
    exclusions: Joi.alternatives()
        .try(Joi.array().items(Joi.string()).min(2), Joi.string()),
    itinerary: Joi.alternatives()
        .try(Joi.array().items(itineraryDayJoi), Joi.string()),
    supportContacts: Joi.alternatives()
        .try(Joi.array().items(supportContactJoi).min(2), Joi.string()),
    termsAndConditions: Joi.alternatives()
        .try(Joi.array().items(termsAndConditionsJoi).min(2), Joi.string()),
    faqSection: Joi.alternatives()
        .try(faqSectionJoi, Joi.string()),
    packageType: Joi.string(),
    destination: Joi.string(),
    isFeatured: Joi.alternatives().try(Joi.boolean(), Joi.string()),
    isActive: Joi.alternatives().try(Joi.boolean(), Joi.string()),
});