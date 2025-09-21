const express = require('express')
const router = express.Router();
const authController = require('../controllers/auth.controller')
const authMiddleware = require('../middlewares/auth.middlware')

//User auth APIs
router.post('/user/register', authController.registerUser)
router.post('/user/login', authController.loginUser)
router.get('/user/logout', authController.logoutUser)

//Food Partner auth APIs
router.post('/foodPartner/register', authController.registerFoodPartner)
router.post('/foodPartner/login', authController.loginFoodPartner)
router.get('/foodPartner/logout', authController.logoutFoodPartner)

// New: session endpoints
router.get('/user/me', authMiddleware.authUserMiddleware, authController.getUserSession)
router.get('/foodPartner/me', authMiddleware.authFoodPartnerMiddleware, authController.getPartnerSession)

module.exports = router;