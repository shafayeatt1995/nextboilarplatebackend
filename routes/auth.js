const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  logout,
  socialLogin,
} = require("../controller/AuthController");
const { signupValidation, loginValidation } = require("../validation/auth");
const { validation } = require("../validation");
const passport = require("passport");
require("../config/passport");
const data = { error: true };

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

router.post("/signup", signupValidation, validation, signup);
router.post("/login", loginValidation, validation, login);
router.get(
  "/social-login/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);
router.get(
  "/social-login/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.BASE_URL}/social-login?e=${btoa(
      JSON.stringify(data)
    )}`,
  }),
  socialLogin
);
router.get("/logout", logout);

module.exports = router;
