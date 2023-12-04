const { model, Schema } = require("mongoose");

module.exports = model(
    "Antiswear",
    new Schema({
        _id: { type: String, require: true },
        logs: { type: Boolean, default: false },
    })
);