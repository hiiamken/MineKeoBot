"use strict";
// src/admincommands/slash/whitelist.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitelist = void 0;
const discord_js_1 = require("discord.js");
const updateSecurityConfig_1 = require("../../utils/updateSecurityConfig");
const securityConfig_1 = __importDefault(require("../../config/securityConfig"));
exports.whitelist = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Thêm hoặc gỡ user/role khỏi whitelist')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((sub) => sub
        .setName('add')
        .setDescription('Thêm vào whitelist')
        .addUserOption((opt) => opt.setName('user').setDescription('Người dùng cần thêm').setRequired(false))
        .addRoleOption((opt) => opt.setName('role').setDescription('Role cần thêm').setRequired(false)))
        .addSubcommand((sub) => sub
        .setName('remove')
        .setDescription('Gỡ khỏi whitelist')
        .addUserOption((opt) => opt.setName('user').setDescription('Người dùng cần gỡ').setRequired(false))
        .addRoleOption((opt) => opt.setName('role').setDescription('Role cần gỡ').setRequired(false))),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        if (!user && !role) {
            return interaction.reply({
                content: '❌ Vui lòng chọn **một** user hoặc role.',
                ephemeral: true,
            });
        }
        if (user && role) {
            return interaction.reply({
                content: '❌ Bạn chỉ được chọn **một** trong hai: user hoặc role.',
                ephemeral: true,
            });
        }
        const id = user?.id || role?.id;
        if (!id) {
            return interaction.reply({ content: '❌ Không xác định được ID.', ephemeral: true });
        }
        const isUser = !!user;
        const list = isUser
            ? [...securityConfig_1.default.antiNuke.whitelistedUsers]
            : [...securityConfig_1.default.antiNuke.whitelistedRoles];
        if (sub === 'add') {
            if (!list.includes(id))
                list.push(id);
        }
        else {
            const index = list.indexOf(id);
            if (index !== -1)
                list.splice(index, 1);
        }
        await (0, updateSecurityConfig_1.updateSecurityConfig)({
            antiNuke: {
                ...securityConfig_1.default.antiNuke,
                whitelistedUsers: isUser ? list : securityConfig_1.default.antiNuke.whitelistedUsers,
                whitelistedRoles: !isUser ? list : securityConfig_1.default.antiNuke.whitelistedRoles,
            },
        });
        return interaction.reply({
            content: `${sub === 'add' ? '✅ Thêm' : '🗑️ Gỡ'} ${isUser ? `user <@${id}>` : `role <@&${id}>`} ${sub === 'add' ? 'vào' : 'khỏi'} whitelist thành công.`,
            ephemeral: true,
        });
    },
};
