const { Schema, model } = require('mongoose');

const commentLikeSchema = new Schema({
  comment: { type: Schema.Types.ObjectId, ref: 'Comment', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  foodPartner: { type: Schema.Types.ObjectId, ref: 'FoodPartner' }
}, { timestamps: true });

commentLikeSchema.index({ comment:1, user:1 }, { unique: true, sparse: true });
commentLikeSchema.index({ comment:1, foodPartner:1 }, { unique: true, sparse: true });

module.exports = model('CommentLike', commentLikeSchema);
