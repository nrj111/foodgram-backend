const express = require('express');
const foodController = require("../controllers/food.controller")
const authMiddleware = require("../middlewares/auth.middlware");
const router = express.Router();
const multer = require('multer');
const storageService = require('../services/storage.service');

const upload = multer({
    storage: multer.memoryStorage(),
})

/* For direct client upload to ImageKit: returns signature/token/expire/publicKey/urlEndpoint */
router.get('/upload/auth',
    authMiddleware.authFoodPartnerMiddleware,
    (req, res) => {
        try {
            const auth = storageService.getImagekitAuth();
            return res.status(200).json(auth);
        } catch (e) {
            return res.status(500).json({ message: 'Failed to get upload auth', error: e?.message || String(e) });
        }
    }
)

/* POST /api/food/ [protected]*/
router.post('/',
    authMiddleware.authFoodPartnerMiddleware,
    upload.single("video"),
    foodController.createFood)

// Feed: make public (remove auth middleware)
router.get("/",
    foodController.getFoodItems)

// Single item (public)
router.get("/item/:id",
    foodController.getFoodItem)

router.post('/like',
    authMiddleware.authUserMiddleware,
    foodController.likeFood)

router.post('/save',
    authMiddleware.authUserMiddleware,
    foodController.saveFood
)

router.get('/save',
    authMiddleware.authUserMiddleware,
    foodController.getSaveFood
)

module.exports = router