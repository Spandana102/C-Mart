
const mongoose = require("mongoose");

// ========================================
// C-MART MONGODB ATLAS CONNECTION
// ========================================

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error(
      "MONGO_URI is missing in server/.env"
    );
  }

  try {
    console.log("=================================");
    console.log("Connecting to MongoDB Atlas...");
    console.log("=================================");

    await mongoose.connect(mongoURI, {
      // Prefer IPv4
      family: 4,

      // Connection timeout settings
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,

      // Keep a small connection pool
      maxPoolSize: 10,
    });

    console.log("=================================");
    console.log("MongoDB Connected Successfully");
    console.log(
      "DATABASE NAME:",
      mongoose.connection.name
    );
    console.log("=================================");

    return mongoose.connection;

  } catch (error) {
    console.error("=================================");
    console.error("MongoDB Connection Failed");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);

    const servers = error.reason?.servers;

    if (servers) {
      for (const [server, details] of servers) {
        console.error("-------------------------");
        console.error("Server:", server);
        console.error(
          "Server Type:",
          details.type
        );
        console.error(
          "Server Error:",
          details.error?.message || "Unknown"
        );
      }
    }

    console.error("=================================");

    throw error;
  }
};

// Handle disconnection events
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB Disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB Reconnected");
});

module.exports = connectDB;
