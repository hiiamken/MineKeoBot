const { model, Schema } = require("mongoose");

let countingSchema = new Schema({
    GuildID: String,
    Channel: String,
    Count: Number,
    LastPerson: String,
    IsNumberEntered: { type: Boolean, default: false }, // Thêm trường mới
})

module.exports = model("Couting", countingSchema)