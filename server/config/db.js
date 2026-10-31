
const mongoose = require("mongoose");

// ========================================
// C-MART MONGODB ATLAS CONNECTION
// ========================================

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  try {
    console.log("=================================");
    console.log("Connecting to MongoDB Atlas...");
    console.log("=================================");

    const conn = await mongoose.connect(mongoURI, {
      // Use IPv6/NAT64 for the current network
      family: 6,

      // Connection timeouts
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,

      // Connection pool
      maxPoolSize: 10,
      minPoolSize: 0,

      // Retry supported write operations
      retryWrites: true,
    });

    console.log("=================================");
    console.log("MongoDB Connected Successfully");
    console.log("DATABASE NAME:", conn.connection.name);
    console.log("=================================");

    return conn.connection;

  } catch (error) {
    console.error("=================================");
    console.error("MongoDB Connection Failed");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);

    if (error.reason?.servers) {
      for (const [server, details] of error.reason.servers) {
        console.error("-------------------------");
        console.error("Server:", server);
        console.error("Server Type:", details.type);
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

// MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB Disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB Reconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB Connection Error:", error.message);
});

module.exports = connectDB;
