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
    const actorUser = req.user
    const actorPartner = req.foodPartner
    if (!actorUser && !actorPartner) {
      return res.status(401).json({ message: 'Authentication required to comment', code: 'NO_AUTH' })
    }
    const { foodId, text } = req.body
    if (!foodId || !text?.trim()) {
      return res.status(400).json({ message: 'foodId and text required', code: 'VALIDATION' })
    }
    const food = await foodModel.findById(foodId).select('_id')
    if (!food) return res.status(404).json({ message: 'Food not found', code: 'NOT_FOUND' })

    const commentDoc = await commentModel.create({
      food: foodId,
      user: actorUser ? actorUser._id : undefined,
      foodPartner: actorPartner ? actorPartner._id : undefined,
      text: text.trim()
    })
    // (optional) increment counter if you later add commentsCount on food
    foodModel.findByIdAndUpdate(foodId, { $inc: { commentsCount: 1 } }).catch(()=>{})

    return res.status(201).json({
      message: 'Comment added',
      comment: {
        _id: commentDoc._id,
        text: commentDoc.text,
        likeCount: 0,
        liked: false,
        user: {
          _id: actorUser?.id || actorPartner?.id,
            name: actorUser?.fullName || actorPartner?.name || 'You'
        },
        createdAt: commentDoc.createdAt,
        relTime: '0s'
      }
    })
  } catch (e) {
    return res.status(500).json({
      message: 'Failed to add comment',
      error: e?.message || String(e),
      code: 'SERVER_ERROR'
    })
  }
}

exports.getComments = async (req, res) => {
  try {
    const { foodId } = req.params
    if (!foodId) return res.status(400).json({ message: 'foodId required', comments: [], code: 'VALIDATION' })
    const comments = await commentModel.find({ food: foodId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()

    const uid = req.user?._id?.toString()
    const pid = req.foodPartner?._id?.toString()

    const shaped = comments.map(c => {
      const liked =
        (uid && c.likedBy?.some(id => id.toString() === uid)) ||
        (pid && c.likedByPartners?.some(id => id.toString() === pid)) || false
      return {
        _id: c._id,
        text: c.text,
        likeCount: c.likeCount || 0,
        liked,
        user: {
          _id: c.user || c.foodPartner || null,
          name: c.user ? 'User' : (c.foodPartner ? 'Partner' : 'User')
        },
        createdAt: c.createdAt,
        relTime: safeRelTime(new Date(c.createdAt))
      }
    })

    const resp = {
      message: 'Comments fetched',
      comments: shaped
    }
    if (req.query.debug === '1') {
      resp.authDebug = { isUser: !!uid, isPartner: !!pid }
    }
    return res.status(200).json(resp)
  } catch (e) {
    return res.status(500).json({
      message: 'Failed to fetch comments',
      error: e?.message || String(e),
      comments: [],
      code: 'SERVER_ERROR'
    })
  }
}

exports.toggleCommentLike = async (req, res) => {
  try {
    const actorUser = req.user
    const actorPartner = req.foodPartner
    if (!actorUser && !actorPartner) {
      return res.status(401).json({ message: 'Authentication required', code: 'NO_AUTH' })
    }
    const { commentId } = req.body
    if (!commentId) return res.status(400).json({ message: 'commentId required', code: 'VALIDATION' })

    const comment = await commentModel.findById(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found', code: 'NOT_FOUND' })

    let liked
    if (actorUser) {
      const uid = actorUser._id.toString()
      const idx = comment.likedBy.findIndex(id => id.toString() === uid)
      if (idx >= 0) {
        comment.likedBy.splice(idx, 1)
        comment.likeCount = Math.max(0, comment.likeCount - 1)
        liked = false
      } else {
        comment.likedBy.push(actorUser._id)
        comment.likeCount += 1
        liked = true
      }
    } else {
      const pid = actorPartner._id.toString()
      const idx = comment.likedByPartners.findIndex(id => id.toString() === pid)
      if (idx >= 0) {
        comment.likedByPartners.splice(idx, 1)
        comment.likeCount = Math.max(0, comment.likeCount - 1)
        liked = false
      } else {
        comment.likedByPartners.push(actorPartner._id)
        comment.likeCount += 1
        liked = true
      }
    }

    await comment.save()
    return res.status(200).json({
      message: liked ? 'Comment liked' : 'Comment unliked',
      liked,
      likeCount: comment.likeCount
    })
  } catch (e) {
    return res.status(500).json({
      message: 'Failed to like comment',
      error: e?.message || String(e),
      code: 'SERVER_ERROR'
    })
  }
}
