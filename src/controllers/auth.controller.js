const userModel = require('../models/user.model')
const foodPartnerModel = require('../models/foodPartner.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

async function registerUser (req, res){
    const {fullName, email, password} = req.body;

    const isUserAlreadyExists = await userModel.findOne({email})

    if (isUserAlreadyExists){
    return res.status(400).json({
        message: "User Already Exists"
    });
}

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        fullName,
        email,
        password : hashedPassword
    })

    const token = jwt.sign({
        id : user._id
    }, process.env.JWT_SECRET)

    res.cookie("userToken", token)

    res.status(201).json({
        message:"User Registered Sucessfully",
        user: {
            _id : user._id,
            fullName : user.fullName,
            email : user.email
        }
    })
}

async function loginUser (req, res) {
    const {email, password} = req.body;

    const user = await userModel.findOne({email})

    if(!user){
        return res.status(400).json({
        message : "Invalid Username and Password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid){
        return res.status(400).json({
        message : "Invalid Username and Password"
        })
    }

    const token = jwt.sign({
        id : user._id,
    },  process.env.JWT_SECRET)

    res.cookie("userToken", token)

    return res.status(200).json({
        message: "User logged in Successfully",
        id : user._id,
        email : user.email,
        fullName : user.fullName
    })
}

function logoutUser (req, res) {
    res.clearCookie("userToken"); // fixed cookie name
    res.status(200).json({
        message : "User Logged out successfully"
    });
}

async function registerFoodPartner(req, res) {
  try {
    const { name, contactName, phone, address, email, password } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Full name is required" });
    }

    // Check if account exists
    const isAccountAlreadyExists = await foodPartnerModel.findOne({ email });
    if (isAccountAlreadyExists) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create partner
    const foodPartner = await foodPartnerModel.create({
      name,
      contactName,
      phone,
      address,
      email,
      password: hashedPassword,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: foodPartner._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie (simple dev-friendly cookie)
    res.cookie("partnerToken", token);

    // Response
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
  } catch (err) {
    console.error("Error in registerFoodPartner:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function loginFoodPartner (req, res) {
    const {email, password} = req.body;

    const foodPartner = await foodPartnerModel.findOne({email})

    if (!foodPartner){
        return res.status(400).json({
            message : "Invalid Email or Password"
        })
    }
    const isPasswordValid = await bcrypt.compare(password, foodPartner.password)

    if (!isPasswordValid){
        return res.status(400).json({
            message : "Invalid Email or password"
        })
    }

    const token = jwt.sign({
        id : foodPartner._id
    }, process.env.JWT_SECRET)

    res.cookie("partnerToken", token)

    return res.status(200).json({
        message : "Food Partner logged in Successfully",
        foodPartner :{
            id : foodPartner._id,
            email : foodPartner.email,
            fullName : foodPartner.name
        }
    })
}

function logoutFoodPartner (req, res) {
    res.clearCookie("partnerToken")
    return res.status(200).json({
        message : "Food Partner Logged out Successfully"
    })
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    registerFoodPartner,
    loginFoodPartner,
    logoutFoodPartner
}