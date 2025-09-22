const mongoose = require("mongoose");

function connectDB(){
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected");
    }).catch((err) => {
        console.error("DB connection error:", err?.message || err);
    })
} 

module.exports = connectDB;