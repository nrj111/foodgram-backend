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

// Guard: ensure body is present (helps when parsers are missing or wrong Content-Type)
function assertBody(req, res) {
  if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
    res.status(400).json({ message: "Empty request body. Send JSON and set Content-Type: application/json" })
    return false
  }
  return true
}

// Ensure auth responses include explicit CORS headers so cookies stick cross-site
function setCorsForAuth(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

// helpers
const normalizeEmail = (v) => String(v || '').trim().toLowerCase()
function getJwtSecretOrThrow() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('Server misconfiguration: JWT_SECRET is missing')
  return s
}

async function registerUser (req, res){
    try {
        if (!assertBody(req, res)) return
        const fullName = String(req.body.fullName || '').trim()
        const email = normalizeEmail(req.body.email)
        const password = String(req.body.password || '')

        if (!fullName || !email || !password) {
          return res.status(400).json({ message: "fullName, email and password are required" });
        }

        const isUserAlreadyExists = await userModel.findOne({ email })
        if (isUserAlreadyExists){
            return res.status(400).json({ message: "User Already Exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({ fullName, email, password: hashedPassword })
        const token = jwt.sign({ id : user._id }, getJwtSecretOrThrow(), { expiresIn: '7d' })
        setCorsForAuth(req, res)
        res.cookie("userToken", token, cookieOptions)
        return res.status(201).json({
            message:"User Registered Successfully",
            token,
            user: { _id : user._id, fullName : user.fullName, email : user.email },
            redirectTo: "/"
        })
    } catch (err) {
        console.error('registerUser error:', err?.message || err)
        const msg = /JWT_SECRET/.test(String(err?.message)) ? err.message : "Server error during registration"
        return res.status(500).json({ message: msg })
    }
}

async function loginUser (req, res) {
    try {
        if (!assertBody(req, res)) return
        const email = normalizeEmail(req.body.email)
        const password = String(req.body.password || '')

        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await userModel.findOne({ email })
        if(!user || !user.password){
            return res.status(400).json({ message : "Invalid Username and Password" })
        }
        const isPasswordValid = await bcrypt.compare(password, String(user.password))
        if(!isPasswordValid){
            return res.status(400).json({ message : "Invalid Username and Password" })
        }

        const token = jwt.sign({ id : user._id },  getJwtSecretOrThrow(), { expiresIn: '7d' })
        setCorsForAuth(req, res)
        res.cookie("userToken", token, cookieOptions)
        return res.status(200).json({
            message: "User logged in Successfully",
            token,
            id : user._id,
            email : user.email,
            fullName : user.fullName,
            redirectTo: "/"
        })
    } catch (err) {
        console.error('loginUser error:', err?.message || err)
        const msg = /JWT_SECRET/.test(String(err?.message)) ? err.message : "Server error during login"
        return res.status(500).json({ message: msg })
    }
}

function logoutUser (req, res) {
    try {
        setCorsForAuth(req, res)
        res.clearCookie("userToken", { ...cookieOptions })
        return res.status(200).json({ message : "User Logged out successfully" })
    } catch {
        return res.status(200).json({ message : "User Logged out" })
    }
}

async function registerFoodPartner(req, res) {
  try {
    if (!assertBody(req, res)) return
    const name = String(req.body.name || '').trim()
    const contactName = String(req.body.contactName || '').trim()
    const phone = String(req.body.phone || '').trim()
    const address = String(req.body.address || '').trim()
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

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

    const token = jwt.sign({ id: foodPartner._id }, getJwtSecretOrThrow(), { expiresIn: "7d" });
    setCorsForAuth(req, res)
    res.cookie("partnerToken", token, cookieOptions);
    return res.status(201).json({
      message: "Food Partner Registered Successfully",
      token,
      foodPartner: {
        id: foodPartner._id,
        email: foodPartner.email,
        name: foodPartner.name,
        contactName: foodPartner.contactName,
        phone: foodPartner.phone,
        address: foodPartner.address,
      },
      redirectTo: "/"
    });
  } catch (err) {
    console.error('registerFoodPartner error:', err?.message || err)
    const msg = /JWT_SECRET/.test(String(err?.message)) ? err.message : "Server error during partner registration"
    return res.status(500).json({ message: msg });
  }
}

async function loginFoodPartner (req, res) {
    try {
        if (!assertBody(req, res)) return
        const email = normalizeEmail(req.body.email)
        const password = String(req.body.password || '')

        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }

        const foodPartner = await foodPartnerModel.findOne({ email })
        if (!foodPartner || !foodPartner.password){
            return res.status(400).json({ message : "Invalid Email or Password" })
        }

        const isPasswordValid = await bcrypt.compare(password, String(foodPartner.password))
        if (!isPasswordValid){
            return res.status(400).json({ message : "Invalid Email or password" })
        }

        const token = jwt.sign({ id : foodPartner._id }, getJwtSecretOrThrow(), { expiresIn: '7d' })
        setCorsForAuth(req, res)
        res.cookie("partnerToken", token, cookieOptions)
        return res.status(200).json({
            message : "Food Partner logged in Successfully",
            token,
            foodPartner :{
                id : foodPartner._id,
                email : foodPartner.email,
                fullName : foodPartner.name
            },
            redirectTo: "/"
        })
    } catch (err) {
        console.error('loginFoodPartner error:', err?.message || err)
        const msg = /JWT_SECRET/.test(String(err?.message)) ? err.message : "Server error during partner login"
        return res.status(500).json({ message: msg })
    }
}

// Add: complete Food Partner logout
function logoutFoodPartner (req, res) {
    try {
        setCorsForAuth(req, res)
        res.clearCookie("partnerToken", { ...cookieOptions })
        return res.status(200).json({ message : "Food Partner Logged out successfully" })
    } catch {
        return res.status(200).json({ message : "Food Partner Logged out" })
    }
}

// New: session endpoints for frontend redirects
function getUserSession(req, res) {
  if (!req.user) return res.status(401).json({ authenticated: false });
  return res.status(200).json({
    authenticated: true,
    user: { id: req.user._id, email: req.user.email, fullName: req.user.fullName }
  });
}

function getPartnerSession(req, res) {
  if (!req.foodPartner) return res.status(401).json({ authenticated: false });
  return res.status(200).json({
    authenticated: true,
    foodPartner: {
      id: req.foodPartner._id,
      email: req.foodPartner.email,
      name: req.foodPartner.name,
      contactName: req.foodPartner.contactName,
      phone: req.foodPartner.phone,
      address: req.foodPartner.address
    }
  });
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    registerFoodPartner,
    loginFoodPartner,
    logoutFoodPartner,
    getUserSession,
    getPartnerSession
}