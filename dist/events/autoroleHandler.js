"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAutorole = handleAutorole;
const config_1 = require("../config/config"); // Hàm lấy role từ config hoặc database
async function handleAutorole(member) {
    try {
        // Lấy role autorole từ cấu hình
        const autoroleId = (0, config_1.getAutorole)(member.guild.id);
        if (!autoroleId) {
            return;
        }
        // Gán role cho thành viên mới
        const role = member.guild.roles.cache.get(autoroleId);
        if (role) {
            await member.roles.add(role);
        }
        else {
        }
    }
    catch (error) {
    }
}
