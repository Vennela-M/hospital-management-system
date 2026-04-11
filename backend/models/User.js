const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  appointments: { type: Array, default: [] },
  availability: { type: Array, default: [] },
  hospital: String
});

module.exports = mongoose.model("User", userSchema);