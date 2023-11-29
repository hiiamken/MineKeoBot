// Models/Ranking.js
const mongoose = require("mongoose");

const rankingSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    correctCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Ranking", rankingSchema);
