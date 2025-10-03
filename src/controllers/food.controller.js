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
        const { name, description, videoUrl: rawUrl, price: rawPrice } = req.body;
        const price = Number.parseFloat(rawPrice);
        if (!name || Number.isNaN(price) || price < 0) {
            return res.status(400).json({ message: "Valid name and price are required" });
        }

        let videoUrl = String(rawUrl || '').trim();
        if (!videoUrl) {
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ message: "Provide videoUrl or attach video (field 'video')" });
            }
            // Fallback only for small files (serverless limit)
            videoUrl = await storageService.uploadFile(req.file.buffer, uuid(), req.file.mimetype);
        }

        const food = await foodModel.create({
            name,
            description,
            video: videoUrl,
            price,
            foodPartner: req.foodPartner._id,
            likeCount: 0,
            savesCount: 0
        });
        // ensure counters present
        food.likeCount = 0;
        food.savesCount = 0;
        return res.status(201).json({ message: "food created successfully", food });
    } catch (err) {
        return res.status(500).json({ message: "Failed to create food", error: err?.message || err });
    }

}

// NEW: fetch single food item (populated)
async function getFoodItem(req, res) {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "Food id required" });
        const item = await foodModel.findById(id).populate({ path: 'foodPartner', select: 'name' });
        if (!item) return res.status(404).json({ message: "Food not found" });
        return res.status(200).json({ message: "Food item fetched successfully", food: item });
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch food item", error: err?.message || String(err) });
    }
}

async function getFoodItems(req, res) {
    try {
        const { partner, random } = req.query;
        const filter = {};
        if (partner) filter.foodPartner = partner;
        let foodItems = await foodModel
            .find(filter)
            .populate({ path: 'foodPartner', select: 'name' });

        if (random) {
            // Fisher-Yates shuffle in-place
            for (let i = foodItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [foodItems[i], foodItems[j]] = [foodItems[j], foodItems[i]];
            }
        }
        let likedIds = new Set()
        let savedIds = new Set()
        try {
            if (req.user) {
                const userId = req.user._id
                const likes = await likeModel.find({ user: userId, food: { $in: foodItems.map(f => f._id) } }).select('food')
                const saves = await saveModel.find({ user: userId, food: { $in: foodItems.map(f => f._id) } }).select('food')
                likedIds = new Set(likes.map(l => String(l.food)))
                savedIds = new Set(saves.map(s => String(s.food)))
            }
        } catch {}
        const withFlags = foodItems.map(f => ({
            ...f.toObject(),
            liked: likedIds.has(String(f._id)),
            saved: savedIds.has(String(f._id))
        }))
        return res.status(200).json({
            message: "Food items fetched successfully",
            foodItems: withFlags
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch food items", error: err?.message || String(err) });
    }
}

async function likeFood(req, res) {
    try {
        const { foodId } = req.body;
        const user = req.user;
        if (!foodId) return res.status(400).json({ message: "foodId is required" });
        const food = await foodModel.findById(foodId);
        if (!food) return res.status(404).json({ message: "Food not found" });

        const isAlreadyLiked = await likeModel.findOne({ user: user._id, food: foodId });

        if (isAlreadyLiked) {
            await likeModel.deleteOne({ user: user._id, food: foodId });
            await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: -1 } });
            const updated = await foodModel.findById(foodId).select('likeCount');
            return res.status(200).json({
                message: "Food unliked successfully",
                liked: false,
                likeCount: Math.max(0, updated.likeCount),
                // backward compat
                like: null
            });
        }

        const like = await likeModel.create({ user: user._id, food: foodId });
        await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: 1 } });
        const updated = await foodModel.findById(foodId).select('likeCount');

        return res.status(201).json({
            message: "Food liked successfully",
            like,
            liked: true,
            likeCount: updated.likeCount
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to process like", error: err?.message || String(err) });
    }
}

async function saveFood(req, res) {
    try {
        const { foodId } = req.body;
        const user = req.user;
        if (!foodId) return res.status(400).json({ message: "foodId is required" });
        const food = await foodModel.findById(foodId);
        if (!food) return res.status(404).json({ message: "Food not found" });

        const isAlreadySaved = await saveModel.findOne({ user: user._id, food: foodId });

        if (isAlreadySaved) {
            await saveModel.deleteOne({ user: user._id, food: foodId });
            await foodModel.findByIdAndUpdate(foodId, { $inc: { savesCount: -1 } });
            const updated = await foodModel.findById(foodId).select('savesCount');
            return res.status(200).json({
                message: "Food unsaved successfully",
                saved: false,
                savesCount: Math.max(0, updated.savesCount),
                save: null
            });
        }

        const save = await saveModel.create({ user: user._id, food: foodId });
        await foodModel.findByIdAndUpdate(foodId, { $inc: { savesCount: 1 } });
        const updated = await foodModel.findById(foodId).select('savesCount');

        return res.status(201).json({
            message: "Food saved successfully",
            save,
            saved: true,
            savesCount: updated.savesCount
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to process save", error: err?.message || String(err) });
    }
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
        // changed: send empty array instead of 404 for easier client handling
        return res.status(200).json({ message: "No saved foods", savedFoods: [] });
    }

    res.status(200).json({
        message: "Saved foods retrieved successfully",
        savedFoods
    });

}

async function deleteFood(req, res) {
    try {
        if (!req.foodPartner || !req.foodPartner._id) {
            return res.status(401).json({ message: "Partner authentication required" });
        }
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "Food id required" });

        const food = await foodModel.findOne({ _id: id, foodPartner: req.foodPartner._id });
        if (!food) {
            return res.status(404).json({ message: "Food not found or not owned by partner" });
        }

        // Clean related documents (likes / saves) – fire & forget
        Promise.allSettled([
            likeModel.deleteMany({ food: id }),
            saveModel.deleteMany({ food: id })
        ]).catch(()=>{});

        await food.deleteOne();
        return res.status(200).json({ message: "Food deleted successfully", deleted: true, id });
    } catch (err) {
        return res.status(500).json({ message: "Failed to delete food", error: err?.message || String(err) });
    }
}

module.exports = {
    createFood,
    getFoodItem,
    getFoodItems,
    likeFood,
    saveFood,
    getSaveFood,
    deleteFood
}