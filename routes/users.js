const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  smartWalletAddress: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

router.post("/register", async (req, res) => {
  console.log("Registration attempt:", req.body);
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, email, password, smartWalletAddress } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({
      name,
      email,
      password,
      smartWalletAddress,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ token, message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ message: "Server Error during registration" });
  }
});

router.post("/login", async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credentials" });

    const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, smartWalletAddress: user.smartWalletAddress });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server Error during login" });
  }
});

module.exports = router;
