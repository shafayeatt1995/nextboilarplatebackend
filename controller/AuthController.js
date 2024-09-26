const jwt = require("jsonwebtoken");
const { randomKey } = require("../utils");
const { User } = require("../models");

const controller = {
  async signup(req, res) {
    try {
      req.body.email = req.body.email.toLowerCase().trim();
      const { email, name, password } = req.body;
      await User.create({ email, name, password });

      res.json({ success: false });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Something wrong. Please try again" });
    }
  },

  async login(req, res) {
    try {
      const { _id, name, email, power, type, socialAccount, provider } =
        req.user;
      const payload = { _id, name, email, type, socialAccount, provider };

      if (power === 420 && type === "admin") {
        payload.isAdmin = true;
      }

      const token = jwt.sign(payload, process.env.AUTH_SECRET, {
        expiresIn: "7 days",
      });

      res.status(200).json({ user: payload, token });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Something wrong. Please try again" });
    }
  },

  async socialLogin(req, res) {
    try {
      delete req.user;
      const { provider, id, displayName, email, picture } = req.passportUser;
      const user = await User.findOne({ email });
      if (user) {
        if (user.provider === provider && user.socialAccount) {
          const credential = { email, id, provider, key: randomKey(20) };
          res.redirect(
            `${process.env.BASE_URL}/social-login?c=${btoa(
              JSON.stringify(credential)
            )}`
          );
        } else {
          const data = { error: true };
          res.redirect(
            `${process.env.BASE_URL}/social-login?e=${btoa(
              JSON.stringify(data)
            )}`
          );
        }
      } else {
        await User.create({
          name: displayName,
          email,
          password: `${id}+${process.env.SOCIAL_LOGIN_PASS}`,
          avatar: picture,
          socialAccount: true,
          provider,
        });
        const credential = { email, id, provider, key: randomKey(20) };
        res.redirect(
          `${process.env.BASE_URL}/social-login?c=${btoa(
            JSON.stringify(credential)
          )}`
        );
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Something wrong. Please try again" });
    }
  },

  async logout(req, res) {
    res.status(200).json({ success: true, message: "Logout successful" });
  },
};

module.exports = controller;
