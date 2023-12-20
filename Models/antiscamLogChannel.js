const { model, Schema } = require("mongoose");

let antiscamLogChannel = new Schema({
    Guild: String,
    logChannel: String
});

module.exports = model("antiscamLog", antiscamLogChannel);
