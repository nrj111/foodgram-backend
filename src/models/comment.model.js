const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true, index: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  likeCount: { type: Number, default: 0 }
}, { timestamps: true })

commentSchema.index({ food: 1, createdAt: -1 })

module.exports = mongoose.model('comment', commentSchema)
