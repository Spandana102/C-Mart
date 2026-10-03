const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://spandanaaedu3110_db_user:6uv07Gl9nB6P2oG8@cluster0.g2nsls5.mongodb.net/CampusBazaar?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

async function test() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected Successfully!");
  } catch (err) {
    console.error("❌ Connection Error:");
    console.error(err);
  } finally {
    await client.close();
  }
}

test();