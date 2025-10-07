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

// Helper: decide Secure based on request (HTTPS or known prod origins)
function isHttpsRequest(req) {
  if (req.secure) return true
  const xfProto = req.headers['x-forwarded-proto']
  if (typeof xfProto === 'string' && xfProto.split(',')[0].trim() === 'https') return true
  const origin = req.headers.origin || ''
  return origin.startsWith('https://')
}
function getCookieOptions(req) {
  return { ...cookieOptions, secure: isHttpsRequest(req) }
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
// Improved JWT secret handling with better error messages
function getJwtSecretOrThrow() {
  const s = process.env.JWT_SECRET
  if (!s) {
    console.error('[CRITICAL] JWT_SECRET environment variable is not set!');
    throw new Error('Server configuration error: JWT_SECRET is missing')
  }
  return s
}

// Helper to aggressively clear a cookie across secure variants
function clearCookieAll(res, name) {
  const base = { path: '/', sameSite: 'none' };
  const expired = new Date(0);
  const variants = [
    { secure: true },
    { secure: false }
  ];
  variants.forEach(v => {
    res.cookie(name, '', { ...base, ...v, httpOnly: true, expires: expired, maxAge: 0 });
    res.clearCookie(name, { ...base, ...v });
  });
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
        res.cookie("userToken", token, getCookieOptions(req))
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
            return res.status(400).json({ message : "Invalid username or password" })
        }
        const isPasswordValid = await bcrypt.compare(password, String(user.password))
        if(!isPasswordValid){
            return res.status(400).json({ message : "Invalid username or password" })
        }

        // Get JWT secret with proper error handling
        let token;
        try {
            token = jwt.sign({ id : user._id }, getJwtSecretOrThrow(), { expiresIn: '7d' })
        } catch (err) {
            console.error('JWT signing error:', err);
            return res.status(500).json({ message: "Authentication service error" });
        }
        
        setCorsForAuth(req, res)
        // Mutual exclusion: clear any partner token first
        clearCookieAll(res, 'partnerToken');
        res.cookie("userToken", token, getCookieOptions(req))
        return res.status(200).json({
            message: "User logged in Successfully",
            token,
            id : user._id,
            email : user.email,
            fullName : user.fullName,
            redirectTo: "/"
        })
    } catch (err) {
        console.error('loginUser error:', err);
        const isMongo = err.name === 'MongoServerError' || err.name === 'MongoError';
        if (isMongo) {
            return res.status(500).json({ message: "Database connection error" });
        }
        return res.status(500).json({ message: "Server error during login" })
    }
}

function logoutUser (req, res) {
    try {
        setCorsForAuth(req, res)
        clearCookieAll(res, "userToken");
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
    res.cookie("partnerToken", token, getCookieOptions(req));
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
            return res.status(400).json({ message : "Invalid email or password" })
        }

        const isPasswordValid = await bcrypt.compare(password, String(foodPartner.password))
        if (!isPasswordValid){
            return res.status(400).json({ message : "Invalid email or password" })
        }

        // Get JWT secret with proper error handling
        let token;
        try {
            token = jwt.sign({ id : foodPartner._id }, getJwtSecretOrThrow(), { expiresIn: '7d' })
        } catch (err) {
            console.error('JWT signing error:', err);
            return res.status(500).json({ message: "Authentication service error" });
        }
        
        setCorsForAuth(req, res)
        // Mutual exclusion: clear any user token first
        clearCookieAll(res, 'userToken');
        res.cookie("partnerToken", token, getCookieOptions(req))
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
        console.error('loginFoodPartner error:', err);
        const isMongo = err.name === 'MongoServerError' || err.name === 'MongoError';
        if (isMongo) {
            return res.status(500).json({ message: "Database connection error" });
        }
        return res.status(500).json({ message: "Server error during login" })
    }
}

// Add: complete Food Partner logout
function logoutFoodPartner (req, res) {
    try {
        setCorsForAuth(req, res)
        clearCookieAll(res, "partnerToken");
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