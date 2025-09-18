const mongoose = require("mongoose");

function connectDB(){
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected");
    }).catch((err) => {
        console.log("DB connection error");
    })
} 

module.exports = connectDB;