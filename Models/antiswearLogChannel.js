const { model, Schema } = require("mongoose");

let antiswearLogChannel = new Schema({
    Guild: String,
    logChannel: String
});

module.exports = model("antiswearLog", antiswearLogChannel);