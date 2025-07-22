require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../model/userModel.js");
const nodemailer = require("nodemailer");

//Utility function to create a JWT
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

//Register method
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All filed are must be filled" });
    } else if (
      !validator.isStrongPassword(password, { minLength: 8, minSymbols: 1 })
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password not strong enough. Use at least 8 characters, including uppercase, lowercase, numbers, and symbols.",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "email is already in use" });
    }

    const salt = await bcrypt.genSalt(10); //gen password
    const hashPassword = await bcrypt.hash(password, salt); //actual password combo

    const newUser = new User({ name, email, password: hashPassword });
    const user = await newUser.save();

    const token = createToken(user._id);

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000, //3 days
      })
      .status(200)
      .json({
        success: true,
        message: "Register Successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      });
  } catch (error) {
    console.error("Error during registration:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
};

//Login method
const loginUser = async (req, res) => {
  const { name, password } = req.body;

  try {
    //validate input
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: "Name and Password are required",
      });
    }
    //check user exist
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist. Please register first.",
      });
    }

    //check password is matching
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password , try again" });
    }

    const token = createToken(user._id);
    res
      .cookie("token", token, {
        httpOnly: true,
      })
      .status(200)
      .json({
        success: true,
        message: "Successfully Login",
        user: {
         id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while logging in. Please try again later.",
    });
  }
};

//forgetPassword
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ email: user.email }, process.env.SECRET, {
      expiresIn: "15m",
    });

    //show up the reset password UI
    const resetUrl = `${process.env.CLIENT_URL}/ResetPassword/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    //Mail structure
    const mailOptions = {
      from: process.env.MY_GMAIL,
      to: email,
      subject: "Reset Your Password",
      html: `
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background: #196A0B ; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ message: "Password reset link has been sent to your email" });
  } catch (error) {
    console.error("Forget password error:", error.message);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

//reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ message: "Password is required" });

    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Invalid or expired token" });
  }
};



module.exports = {
  registerUser,
  loginUser,
  forgetPassword,
  resetPassword,
};
