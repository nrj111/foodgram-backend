const { Schema, model } = require('mongoose')

const commentSchema = new Schema({
  food: { type: Schema.Types.ObjectId, ref: 'Food', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  foodPartner: { type: Schema.Types.ObjectId, ref: 'FoodPartner' },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  likeCount: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],           // existing user likes
  likedByPartners: [{ type: Schema.Types.ObjectId, ref: 'FoodPartner' }] // NEW partner likes
}, { timestamps: true })

commentSchema.index({ food: 1, createdAt: -1 }) // Optional performance index

module.exports = model('Comment', commentSchema)
