const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: String,
    role: String,

    // 🔥 ADD BELOW ROLE
    age: Number,
    gender: String,
    bloodGroup: String,

    // 🔥 ADD BELOW THESE
    address: String,
    diseases: String,
    allergies: String,
    medications: String,
    height: String,
    weight: String,
    surgeries: String,
    conditions: String,

    reports: [String]
});

module.exports = mongoose.model("User", UserSchema);