const express = require('express');
const foodPartnerController = require("../controllers/food-partner.controller");
const authMiddleware = require("../middlewares/auth.middlware"); // fixed path

const router = express.Router();


/* /api/food-partner/:id */
router.get("/:id",
    authMiddleware.authUserMiddleware, // allow logged-in users to view partner profile
    foodPartnerController.getFoodPartnerById)

module.exports = router;