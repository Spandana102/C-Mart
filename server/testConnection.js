require("dotenv").config();
const mongoose = require("mongoose");

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected Successfully!");

        await mongoose.connection.close();
    } catch (err) {
        console.error("MongoDB Connection Error:");
        console.error(err.message);
    }
}

test();