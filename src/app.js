const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const foodPartnerRoutes = require('./routes/food-partner.routes'); // add
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes); // add

module.exports = app;