const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://sreeharithota01:sreehari123@cluster0.34bgk.mongodb.net/");
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.log("❌ DB Error:", error);
  }
};

module.exports = connectDB;