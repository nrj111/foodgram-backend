const userModel = require('../models/user.model')
const foodPartnerModel = require('../models/foodPartner.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Common cookie options for cross-site cookies on Vercel/HTTPS
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
}

async function registerUser (req, res){
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
          return res.status(400).json({ message: "fullName, email and password are required" });
        }
        const isUserAlreadyExists = await userModel.findOne({email})
        if (isUserAlreadyExists){
            return res.status(400).json({ message: "User Already Exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({ fullName, email, password: hashedPassword })
        const token = jwt.sign({ id : user._id }, process.env.JWT_SECRET)
        res.cookie("userToken", token, cookieOptions)
        return res.status(201).json({
            message:"User Registered Successfully",
            user: { _id : user._id, fullName : user.fullName, email : user.email }
        })
    } catch {
        return res.status(500).json({ message: "Server error during registration" })
    }
}

async function loginUser (req, res) {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await userModel.findOne({email})
        if(!user || !user.password){
            return res.status(400).json({ message : "Invalid Username and Password" })
        }
        const isPasswordValid = await bcrypt.compare(String(password), String(user.password))
        if(!isPasswordValid){
            return res.status(400).json({ message : "Invalid Username and Password" })
        }
        const token = jwt.sign({ id : user._id },  process.env.JWT_SECRET)
        res.cookie("userToken", token, cookieOptions)
        return res.status(200).json({
            message: "User logged in Successfully",
            id : user._id,
            email : user.email,
            fullName : user.fullName
        })
    } catch {
        return res.status(500).json({ message: "Server error during login" })
    }
}

function logoutUser (req, res) {
    try {
        res.clearCookie("userToken", { ...cookieOptions })
        return res.status(200).json({ message : "User Logged out successfully" })
    } catch {
        return res.status(200).json({ message : "User Logged out" })
    }
}

async function registerFoodPartner(req, res) {
  try {
    const { name, contactName, phone, address, email, password } = req.body;
    if (!name || !contactName || !phone || !address || !email || !password) {
      return res.status(400).json({ message: "name, contactName, phone, address, email and password are required" });
    }
    const isAccountAlreadyExists = await foodPartnerModel.findOne({ email });
    if (isAccountAlreadyExists) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const foodPartner = await foodPartnerModel.create({
      name, contactName, phone, address, email, password: hashedPassword,
    });
    const token = jwt.sign({ id: foodPartner._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("partnerToken", token, cookieOptions);
    return res.status(201).json({
      message: "Food Partner Registered Successfully",
      foodPartner: {
        id: foodPartner._id,
        email: foodPartner.email,
        name: foodPartner.name,
        contactName: foodPartner.contactName,
        phone: foodPartner.phone,
        address: foodPartner.address,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error during partner registration" });
  }
}

async function loginFoodPartner (req, res) {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }
        const foodPartner = await foodPartnerModel.findOne({email})
        if (!foodPartner || !foodPartner.password){
            return res.status(400).json({ message : "Invalid Email or Password" })
        }
        const isPasswordValid = await bcrypt.compare(String(password), String(foodPartner.password))
        if (!isPasswordValid){
            return res.status(400).json({ message : "Invalid Email or password" })
        }
        const token = jwt.sign({ id : foodPartner._id }, process.env.JWT_SECRET)
        res.cookie("partnerToken", token, cookieOptions)
        return res.status(200).json({
            message : "Food Partner logged in Successfully",
            foodPartner :{
                id : foodPartner._id,
                email : foodPartner.email,
                fullName : foodPartner.name
            }
        })
    } catch {
        return res.status(500).json({ message: "Server error during partner login" })
    }
}

function logoutFoodPartner (req, res) {
    try {
        res.clearCookie("partnerToken", { ...cookieOptions })
        return res.status(200).json({ message : "Food Partner Logged out Successfully" })
    } catch {
        return res.status(200).json({ message : "Food Partner Logged out" })
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    registerFoodPartner,
    loginFoodPartner,
    logoutFoodPartner
}