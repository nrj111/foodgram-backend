const mongoose = require('mongoose')

const foodSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    video : {
        type : String,

    }, 
    description : {
        type : String
    },
    foodPartner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'foodpartner' // align with model name
    },
    price: {                      // <-- added
        type: Number,
        required: true,
        min: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    savesCount: {
        type: Number,
        default: 0
    }
})
 const foodModel = mongoose.model("food", foodSchema);
 module.exports = foodModel;