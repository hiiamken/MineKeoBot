// Models/Ranking.js
const mongoose = require("mongoose");

const rankingSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    correctCount: { type: Number, default: 0 },
    // Các trường khác mà bạn muốn thêm vào ranking có thể được đặt ở đây
});

module.exports = mongoose.model("Ranking", rankingSchema);
