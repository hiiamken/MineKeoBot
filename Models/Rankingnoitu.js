const { model, Schema } = require("mongoose");

const rankingnoituSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    correctCount: { type: Number, default: 0 },
    // Các trường khác mà bạn muốn thêm vào ranking có thể được đặt ở đây
});

module.exports = model("Rankingnoitu", rankingnoituSchema);