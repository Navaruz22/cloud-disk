const { Router } = require("express");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const fileService = require("../services/fileService");
const File = require("../models/File");

const router = new Router();

router.post(
  "/registration",
  [
    check("email", "Uncorrect email").isEmail(),
    check("password", "Password must be longer than 6").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const errors = validationResult(req.body);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors });
      }

      const candidate = await User.findOne({ email });

      if (candidate) {
        return res.status({
          message: `User with email ${email} already exist`,
        });
      }

      const hashPassword = await bcrypt.hash(password, 8);

      const user = new User({
        email,
        password: hashPassword,
      });
      user.save();
      await fileService.createDir(new File({ user: user._id, name: "" }));
      res.status(200).json({ message: "User was created" });
    } catch (error) {
      console.log(error);
      res.send({ message: "Server error" });
    }
  }
);

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPassValid = await bcrypt.compare(password, user.password);
    if (!isPassValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, config.get("secretKey"), {
      expiresIn: "1h",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        diskSpace: user.diskSpace,
        usedSpace: user.usedSpace,
      },
    });
  } catch (error) {
    res.send({ message: "Server error" });
  }
});

module.exports = router;
