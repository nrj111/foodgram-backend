const foodPartnerModel = require('../models/foodPartner.model');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

async function authFoodPartnerMiddleware(req, res, next) {
    const token = req.cookies?.partnerToken; // safe check

    if (!token) {
        return res.status(401).json({ message: "Please Login as Food Partner First" });
    }
         
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const foodPartner = await foodPartnerModel.findById(decoded.id);

        if (!foodPartner) {
            return res.status(401).json({ message: "Food Partner not found" });
        }

        req.foodPartner = foodPartner;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid Token" });
    }
}

async function authUserMiddleware(req, res, next) {
    const token = req.cookies?.userToken; // safe check

    if (!token) {
        return res.status(401).json({ message: "Please Login First" });
    }   
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);      
        const user = await userModel.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }   
        req.user = user;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid Token" });
    }   

}

module.exports = { 
    authFoodPartnerMiddleware,
    authUserMiddleware
}
