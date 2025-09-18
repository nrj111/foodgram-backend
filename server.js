require('dotenv').config();
const app = require("./src/app")
const connectDB = require('./src/db/db')

connectDB();

app.listen(3000, (req, res) => {
    console.log(`App is listening on Port ${process.env.PORT}`);
});
