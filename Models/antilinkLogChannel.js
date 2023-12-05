const { model, Schema } = require("mongoose");

let antilinkLogChannel = new Schema({
    Guild: String,
    Perms: String,
    logChannel: String
});

module.exports = model("antilinkLog", antilinkLogChannel);