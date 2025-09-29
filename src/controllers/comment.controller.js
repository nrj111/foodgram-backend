const commentModel = require('../models/comment.model')
const foodModel = require('../models/food.model')

function safeRelTime(date) {
  const now = Date.now()
  const diff = now - date.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec || 1}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  const wk = Math.floor(day / 7)
  if (wk < 4) return `${wk}w`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo`
  const yr = Math.floor(day / 365)
  return `${yr}y`
}

exports.addComment = async (req, res) => {
  try {
    const user = req.user
    const { foodId, text } = req.body
    if (!foodId || !text?.trim()) return res.status(400).json({ message: 'foodId and text required' })
    const food = await foodModel.findById(foodId).select('_id')
    if (!food) return res.status(404).json({ message: 'Food not found' })
    const comment = await commentModel.create({ user: user._id, food: foodId, text: text.trim() })
    await foodModel.findByIdAndUpdate(foodId, { $inc: { commentsCount: 1 } }).catch(()=>{})
    const populated = await comment.populate({ path: 'user', select: 'name email' })
    return res.status(201).json({
      message: 'Comment added',
      comment: {
        _id: populated._id,
        text: populated.text,
        likeCount: 0,
        liked: false,
        user: { _id: populated.user._id, name: populated.user.name },
        createdAt: populated.createdAt,
        relTime: safeRelTime(populated.createdAt)
      }
    })
  } catch (e) {
    return res.status(500).json({ message: 'Failed to add comment', error: e?.message || String(e) })
  }
}

exports.getComments = async (req, res) => {
  try {
    const { foodId } = req.params
    if (!foodId) return res.status(400).json({ message: 'foodId required' })
    const comments = await commentModel.find({ food: foodId })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate({ path: 'user', select: 'name email' })
    const userId = req.user?._id?.toString()
    return res.status(200).json({
      message: 'Comments fetched',
      comments: comments.map(c => ({
        _id: c._id,
        text: c.text,
        likeCount: c.likeCount,
        liked: userId ? c.likedBy.some(id => id.toString() === userId) : false,
        user: { _id: c.user?._id, name: c.user?.name },
        createdAt: c.createdAt,
        relTime: safeRelTime(c.createdAt)
      }))
    })
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch comments', error: e?.message || String(e) })
  }
}

exports.toggleCommentLike = async (req, res) => {
  try {
    const user = req.user
    const { commentId } = req.body
    if (!commentId) return res.status(400).json({ message: 'commentId required' })
    const comment = await commentModel.findById(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })
    const uid = user._id.toString()
    const idx = comment.likedBy.findIndex(id => id.toString() === uid)
    let liked
    if (idx >= 0) {
      comment.likedBy.splice(idx, 1)
      comment.likeCount = Math.max(0, comment.likeCount - 1)
      liked = false
    } else {
      comment.likedBy.push(user._id)
      comment.likeCount += 1
      liked = true
    }
    await comment.save()
    return res.status(200).json({
      message: liked ? 'Comment liked' : 'Comment unliked',
      liked,
      likeCount: comment.likeCount
    })
  } catch (e) {
    return res.status(500).json({ message: 'Failed to like comment', error: e?.message || String(e) })
  }
}
