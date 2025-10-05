const express = require('express');
const router = express.Router();
const { attachOptionalAuth, requireAnyAuth } = require('../middlewares/auth.middlware');
const { getComments, addComment, likeComment } = require('../controllers/food.controller');

router.get('/api/food/comments/:foodId', attachOptionalAuth, getComments);
router.post('/api/food/comment', requireAnyAuth, addComment);
router.post('/api/food/comment/like', requireAnyAuth, likeComment);

module.exports = router;
