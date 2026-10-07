const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            tls: true
        });

        console.log("MongoDB Connected Successfully");
        console.log("DATABASE NAME:", mongoose.connection.name);

    } catch (error) {
        console.log("MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;