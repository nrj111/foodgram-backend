const foodModel = require('../models/food.model');
const storageService = require('../services/storage.service');
const likeModel = require("../models/likes.model")
const saveModel = require("../models/save.model")
const { v4: uuid } = require("uuid")


async function createFood(req, res) {

    if (!req.foodPartner || !req.foodPartner._id) {
        return res.status(400).json({ message: "Food partner missing" });
    }

    try {
        const rawPrice = req.body.price;
        const price = Number.parseFloat(rawPrice);
        if (Number.isNaN(price) || price < 0) {
            return res.status(400).json({ message: "Valid price is required" });
        }

        let videoUrl = String(req.body.videoUrl || '').trim();

        if (!videoUrl) {
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ message: "Provide videoUrl (direct upload) or attach video file (field 'video')" });
            }
            // Fallback: server-side upload (small files only due to Vercel limit)
            videoUrl = await storageService.uploadFile(req.file.buffer, uuid(), req.file.mimetype);
        }

        const foodItem = await foodModel.create({
            name: req.body.name,
            description: req.body.description,
            video: videoUrl,
            foodPartner: req.foodPartner._id,
            price,
        });

        res.status(201).json({
            message: "food created successfully",
            food: foodItem
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to create food", error: err.message || err });
    }

}

async function getFoodItems(req, res) {
    const foodItems = await foodModel
        .find({})
        .populate({ path: 'foodPartner', select: 'name' }) // populate business name
    res.status(200).json({
        message: "Food items fetched successfully",
        foodItems
    })
}


async function likeFood(req, res) {
    const { foodId } = req.body;
    const user = req.user;

    const isAlreadyLiked = await likeModel.findOne({
        user: user._id,
        food: foodId
    })

    if (isAlreadyLiked) {
        await likeModel.deleteOne({
            user: user._id,
            food: foodId
        })

        await foodModel.findByIdAndUpdate(foodId, {
            $inc: { likeCount: -1 }
        })

        return res.status(200).json({
            message: "Food unliked successfully"
        })
    }

    const like = await likeModel.create({
        user: user._id,
        food: foodId
    })

    await foodModel.findByIdAndUpdate(foodId, {
        $inc: { likeCount: 1 }
    })

    res.status(201).json({
        message: "Food liked successfully",
        like
    })

}

async function saveFood(req, res) {

    const { foodId } = req.body;
    const user = req.user;

    const isAlreadySaved = await saveModel.findOne({
        user: user._id,
        food: foodId
    })

    if (isAlreadySaved) {
        await saveModel.deleteOne({
            user: user._id,
            food: foodId
        })

        await foodModel.findByIdAndUpdate(foodId, {
            $inc: { savesCount: -1 }
        })

        return res.status(200).json({
            message: "Food unsaved successfully"
        })
    }

    const save = await saveModel.create({
        user: user._id,
        food: foodId
    })

    await foodModel.findByIdAndUpdate(foodId, {
        $inc: { savesCount: 1 }
    })

    res.status(201).json({
        message: "Food saved successfully",
        save
    })

}

async function getSaveFood(req, res) {

    const user = req.user;

    const savedFoods = await saveModel
        .find({ user: user._id })
        .populate({
            path: 'food',
            populate: { path: 'foodPartner', select: 'name' } // nested populate business name
        });

    if (!savedFoods || savedFoods.length === 0) {
        return res.status(404).json({ message: "No saved foods found" });
    }

    res.status(200).json({
        message: "Saved foods retrieved successfully",
        savedFoods
    });

}


module.exports = {
    createFood,
    getFoodItems,
    likeFood,
    saveFood,
    getSaveFood
}