const { check } = require("express-validator");
const { User } = require("../models");
const bcrypt = require("bcryptjs");

const signupValidation = [
  check("name")
    .isLength({ min: 1 })
    .withMessage("Name required")
    .isLength({ max: 100 })
    .withMessage("Don't try to spam")
    .trim(),
  check("email")
    .isLength({ min: 1 })
    .withMessage("Email required")
    .isLength({ max: 100 })
    .withMessage("Don't try to spam")
    .isEmail()
    .withMessage("Invalid email address")
    .trim()
    .custom(async (value) => {
      try {
        const checkIsUserAllowed = (email) => {
          const admin_emails = new Set([
            // "shafayetalanik@gmail.com",
            // "admin@admin.com",
            // "scaneating@admin.com",
            "guest",
          ]);
          return admin_emails.has(email);
        };
        const user = await User.findOne({ email: value });
        if (user || checkIsUserAllowed(value)) {
          throw new Error("Email already is use!");
        }
        return true;
      } catch (err) {
        throw new Error(err.message);
      }
    }),

  check("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters")
    .isLength({ max: 100 })
    .withMessage("Don't try to spam"),

  check("confirmPassword")
    .isLength({ min: 4 })
    .withMessage("Confirm password must be at least 4 characters")
    .isLength({ max: 100 })
    .withMessage("Don't try to spam")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
];

const loginValidation = [
  check("email")
    .trim()
    .custom(async (value, { req }) => {
      try {
        const user = await User.findOne({ email: value }).select(
          "+password +power +suspended +deleted"
        );
        if (user) {
          const password =
            req.body.provider === "google"
              ? `${req.body.id}+${process.env.SOCIAL_LOGIN_PASS}`
              : req.body.password;
          const check = await bcrypt.compare(password, user.password);
          if (check) {
            if (user.suspended) {
              throw new Error(`Account suspended`);
            } else {
              if (user.deleted) {
                throw new Error(`Account deleted`);
              } else {
                req.user = user;
              }
            }
          } else {
            throw new Error(`Login failed. Invalid credentials.`);
          }
        } else {
          throw new Error(`Login failed. Invalid credentials.`);
        }
        return true;
      } catch (err) {
        throw new Error(err.message);
      }
    }),
  check("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),
];

module.exports = { signupValidation, loginValidation };
