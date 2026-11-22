
const mongoose = require("mongoose");

// ========================================
// C-MART MONGODB ATLAS CONNECTION
// ========================================

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  // Check MongoDB URI
  if (!mongoURI) {
    throw new Error(
      "MONGO_URI is missing in environment variables"
    );
  }

  // Validate connection string format
  if (
    !mongoURI.startsWith("mongodb+srv://") &&
    !mongoURI.startsWith("mongodb://")
  ) {
    throw new Error(
      "Invalid MongoDB connection string format"
    );
  }

  try {
    console.log("=================================");
    console.log("C-MART MONGODB CONNECTION");
    console.log("=================================");
    console.log("Connecting to MongoDB Atlas...");
    console.log("MongoDB URI Present:", Boolean(mongoURI));
    console.log("Mongoose Version:", mongoose.version);
    console.log("Target Database: CampusBazaar");

    // Connect explicitly to CampusBazaar
    const conn = await mongoose.connect(mongoURI, {
      dbName: "CampusBazaar",

      // Connection timeout settings
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,

      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 0,

      // Heartbeat settings
      heartbeatFrequencyMS: 10000,

      // Retry settings
      retryWrites: true,
    });

    console.log("=================================");
    console.log("MongoDB Connected Successfully");
    console.log("=================================");
    console.log("DATABASE NAME:", conn.connection.name);
    console.log("DATABASE HOST:", conn.connection.host);
    console.log(
      "CONNECTION STATE:",
      conn.connection.readyState
    );
    console.log("=================================");

    // Verify the selected database
    if (conn.connection.name !== "CampusBazaar") {
      throw new Error(
        `Wrong database selected: ${conn.connection.name}`
      );
    }

    return conn.connection;

  } catch (error) {
    console.error("=================================");
    console.error("MONGODB CONNECTION FAILED");
    console.error("=================================");

    console.error(
      "Error Name:",
      error.name || "Unknown"
    );

    console.error(
      "Error Message:",
      error.message || "No message"
    );

    console.error(
      "Error Code:",
      error.code || "Not available"
    );

    // Error cause
    console.error(
      "Error Cause:",
      error.cause?.message || "Not available"
    );

    // MongoDB server details
    if (error.reason?.servers) {
      console.error("MongoDB Server Details:");

      for (const [server, details] of error.reason.servers) {
        console.error("---------------------------------");
        console.error("Server:", server);
        console.error(
          "Server Type:",
          details.type || "Unknown"
        );

        if (details.error) {
          console.error(
            "Server Error:",
            details.error.message
          );

          console.error(
            "Server Error Code:",
            details.error.code || "Not available"
          );
        }
      }
    }

    // DNS / Network errors
    if (error.syscall) {
      console.error("System Call:", error.syscall);
    }

    if (error.hostname) {
      console.error("Hostname:", error.hostname);
    }

    if (error.address) {
      console.error("Address:", error.address);
    }

    if (error.port) {
      console.error("Port:", error.port);
    }

    // Stack trace
    console.error("Error Stack:");
    console.error(
      error.stack || "Stack not available"
    );

    console.error("=================================");

    throw error;
  }
};

// ========================================
// MONGODB CONNECTION EVENTS
// ========================================

mongoose.connection.on("connected", () => {
  console.log(
    "MongoDB connection established"
  );

  console.log(
    "Connected Database:",
    mongoose.connection.name
  );
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

  console.error(
    "MongoDB Error Code:",
    error.code || "Not available"
  );
});

// ========================================
// EXPORT DATABASE CONNECTION
// ========================================

module.exports = connectDB;
