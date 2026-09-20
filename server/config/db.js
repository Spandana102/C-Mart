const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000
        });

        console.log("MongoDB Connected Successfully");

    } catch (error) {
        console.log("MongoDB Connection Failed");
        console.log("Name:", error.name);
        console.log("Message:", error.message);

        if (error.reason && error.reason.servers) {
            console.log("\nMongoDB Server Details:");

            for (const [address, server] of error.reason.servers) {
                console.log("\nServer:", address);
                console.log("Type:", server.type);
                console.log("Error:", server.error?.message || "No detailed error");
            }
        }
    }
};

module.exports = connectDB;