const express = require('express');
const foodController = require("../controllers/food.controller")
const authMiddleware = require("../middlewares/auth.middlware");
const router = express.Router();
const multer = require('multer');
const storageService = require('../services/storage.service');
const commentController = require("../controllers/comment.controller");

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

// NEW: direct single item path to match frontend fetchSingle(`/api/food/${id}`)
router.get("/:id",
    foodController.getFoodItem)

// NEW: delete (frontend already calls DELETE /api/food/:id)
router.delete("/:id",
    authMiddleware.authFoodPartnerMiddleware,
    foodController.deleteFood)

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

// Comments
router.post('/comment',
    authMiddleware.authUserMiddleware,
    commentController.addComment)

// FIX: use attachOptionalAuth instead of non-existent optionalUserMiddleware
router.get('/comments/:foodId',
    authMiddleware.attachOptionalAuth,
    commentController.getComments)

router.post('/comment/like',
    authMiddleware.authUserMiddleware,
    commentController.toggleCommentLike)

module.exports = router