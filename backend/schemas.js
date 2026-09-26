const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

// Extend Joi to include HTML sanitization for strings
const extension = (joi) => ({
    type: "string",
    base: joi.string(),
    messages: {
        "string.escapeHTML": "{{#label}} must not include HTML!",
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error("string.escapeHTML", { value });
                return clean;
            },
        },
    },
});

const Joi = BaseJoi.extend(extension);

// Task Schema
const taskSchema = Joi.object({
    title: Joi.string().required().escapeHTML(),
    due: Joi.date().required(),
    priority: Joi.string().required().valid("low", "medium", "high"),
    description: Joi.string().optional().allow('').escapeHTML(),
    tags: Joi.array().items(Joi.string().escapeHTML()).default([]),
    status: Joi.string().valid("in-progress", "failed", "completed").default("in-progress"),
});

const userSchema = Joi.object({
    fullname: Joi.string().required().escapeHTML(),
    username: Joi.string().required().escapeHTML(),
    email: Joi.string().email().required().escapeHTML(),
    password: Joi.string().required().min(6),
    confirm_password: Joi.string()
        .required()
        .valid(Joi.ref("password")) // Ensure confirm_password matches password
        .messages({ "any.only": "Passwords do not match!" }), // Custom error message
    avatar: Joi.string().optional().uri().escapeHTML(),
});

const userUpdateSchema = Joi.object({
    fullname: Joi.string().optional().escapeHTML(),
    username: Joi.string().optional().escapeHTML(),
    new_email: Joi.string().email().optional().escapeHTML(),
    current_password: Joi.string().optional(),
    new_password: Joi.string().optional().min(6),
    confirm_password: Joi.string()
        .optional()
        .valid(Joi.ref("new_password"))
        .messages({"any.only": "Passwords do not match!"}),
    avatar: Joi.string().optional().uri().escapeHTML(),
}).min(1);
// Export both schemas
module.exports = {
    taskSchema,
    userSchema,
    userUpdateSchema
};