require("dotenv").config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");
const session = require("express-session");
const port = process.env.PORT || 8000;
const { mongoConnect, mongoMiddleware } = require("./config/database");

app.use(cors({ origin: process.env.BASE_URL, credentials: true }));
function verifyRequest(req, res, buf, encoding) {
  req.rawBody = buf.toString(encoding);
}
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, verify: verifyRequest }));
app.use(compression());
app.use(express.json({ limit: "32mb", verify: verifyRequest }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use("/", mongoMiddleware, require("./routes"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Something went wrong!" });
});

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await mongoConnect();
});
