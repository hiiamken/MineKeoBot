"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGuildMemberRemove = onGuildMemberRemove;
const verifyLog_1 = require("../database/verifyLog");
async function onGuildMemberRemove(member) {
    await (0, verifyLog_1.removeUserVerification)(member.id);
}
