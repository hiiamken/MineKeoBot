const { model, Schema } = require("mongoose");

let countingSchema = new Schema({
    GuildID: String,
    Channel: String,
    Count: Number,
    LastPerson: String,
    IsNumberEntered: { type: Boolean, default: false },
    UserWords: { type: Map, of: [String] }
});

module.exports = model("Noichu", countingSchema); // Chú ý rằng tên mô hình là "Noichu" chứ không phải "Couting"
