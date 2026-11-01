
const mongoose = require("mongoose");

// ========================================
// C-MART MONGODB ATLAS CONNECTION
// ========================================

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  // Check MongoDB URI
  if (!mongoURI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  // Validate connection string format
  if (
    !mongoURI.startsWith("mongodb+srv://") &&
    !mongoURI.startsWith("mongodb://")
  ) {
    throw new Error("Invalid MongoDB connection string format");
  }

  try {
    console.log("=================================");
    console.log("C-MART MONGODB CONNECTION");
    console.log("=================================");
    console.log("Connecting to MongoDB Atlas...");

    // Do not force IPv4.
    // Allow Node.js to use the network's default DNS resolution.
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,

      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 0,

      // Retry supported write operations
      retryWrites: true,

      // Keep connection alive
      heartbeatFrequencyMS: 10000
    });

    console.log("=================================");
    console.log("MongoDB Connected Successfully");
    console.log("=================================");
    console.log("DATABASE NAME:", conn.connection.name);
    console.log("DATABASE HOST:", conn.connection.host);
    console.log("CONNECTION STATE:", conn.connection.readyState);
    console.log("=================================");

    return conn.connection;

  } catch (error) {
    console.error("=================================");
    console.error("MONGODB CONNECTION FAILED");
    console.error("=================================");

    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);

    // Display individual server errors
    if (error.reason?.servers) {
      for (const [server, details] of error.reason.servers) {
        console.error("---------------------------------");
        console.error("Server:", server);
        console.error("Server Type:", details.type);

        if (details.error) {
          console.error(
            "Server Error:",
            details.error.message
          );

          console.error(
            "Error Code:",
            details.error.code || "Not available"
          );
        }
      }
    }

    console.error("=================================");

    throw error;
  }
};

// ========================================
// MONGODB CONNECTION EVENTS
// ========================================

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
  console.error(
    "MongoDB Connection Error:",
    error.message
  );
});

module.exports = connectDB;
