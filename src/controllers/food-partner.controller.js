const foodPartnerModel = require('../models/foodPartner.model');
const foodModel = require('../models/food.model');

async function getFoodPartnerById(req, res) {
    const foodPartnerId = req.params.id;

    const foodPartner = await foodPartnerModel.findById(foodPartnerId);
    if (!foodPartner) {
        return res.status(404).json({ message: "Food partner not found" });
    }

    const foodItemsByFoodPartner = await foodModel
        .find({ foodPartner: foodPartnerId })
        .select('video name description price likeCount savesCount')
        .sort({ _id: -1 });

    res.status(200).json({
        message: "Food partner retrieved successfully",
        foodPartner: {
            ...foodPartner.toObject(),
            foodItems: foodItemsByFoodPartner
        }
    });
}

module.exports = {
    getFoodPartnerById
};