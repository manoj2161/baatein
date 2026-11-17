import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Cookie settings for the existing web app
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Remove password before sending user data
const getSafeUser = (user) => {
  const userData = user.toObject();
  delete userData.password;
  return userData;
};

// REGISTER USER
// Signup remains simple: username, email, and password.
// No email verification is required; the user is logged in immediately.
export const signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    const usernameRegex = /^[a-z0-9._]{3,30}$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Username must be 3-30 characters and contain only letters, numbers, periods, and underscores.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters",
      });
    }

    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(409).json({
        message: "This username is already taken. Please choose another.",
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = generateToken(newUser._id);

    // Keep cookie authentication for the web app.
    res.cookie("token", token, cookieOptions);

    // Also return the token for native clients such as the Expo Android app.
    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: getSafeUser(newUser),
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        message:
          field === "username"
            ? "This username is already taken. Please choose another."
            : "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
};

// LOGIN USER
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || user.isDeleted) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    // Keep cookie authentication for the web app.
    res.cookie("token", token, cookieOptions);

    // Also return the token for native clients such as the Expo Android app.
    return res.status(200).json({
      message: "Login successful",
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

// LOGOUT USER
export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);

  return res.status(200).json({
    message: "Logged out successfully",
  });
};
