const mongoose = require("mongoose");
require("dotenv").config();

const url =
  "mongodb+srv://manan12345:manan0000@cluster0.ze3kfxv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("connected", () => {
  console.log("Connected to MongoDB server");
});

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Export the database connection
module.exports = db;
