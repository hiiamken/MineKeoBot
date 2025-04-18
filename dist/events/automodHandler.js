"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAutomod = handleAutomod;
const discord_js_1 = require("discord.js");
const automod_1 = require("../automod/automod");
const warnSystem_1 = require("../database/warnSystem");
const economy_1 = require("../database/economy");
const database_1 = require("../database/database");
const automodConfig_1 = require("../config/automodConfig");
async function handleAutomod(message) {
    if (message.author.bot || !message.guild)
        return false;
    const violation = (0, automod_1.checkAutomodViolation)(message);
    const suspicious = (0, automod_1.isSuspiciousLink)(message);
    if (!violation && !suspicious)
        return false;
    // Check suspicious link that is NOT in violation list
    if (suspicious && !violation) {
        // Admin bypass
        if (message.member?.permissions.has('Administrator'))
            return false;
        // Nếu link đã xác nhận => không xử lý nữa
        if (await (0, warnSystem_1.isLinkConfirmed)(message.author.id, message.content))
            return false;
        await message.delete().catch(() => { });
        const warningEmbed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('⚠️ Phát hiện liên kết nghi ngờ')
            .setDescription(`**<@${message.author.id}>**, bạn vừa đăng một liên kết không rõ nguồn gốc.
Nếu bạn chắc chắn đây là link hợp lệ, hãy nhấn nút bên dưới để xác nhận.`)
            .addFields({ name: '📎 Nội dung bạn đã gửi:', value: `\`\`\`${message.content}\`\`\`` })
            .setFooter({ text: 'Xác nhận để tránh bị cảnh cáo trong tương lai.' })
            .setTimestamp();
        const confirmButton = new discord_js_1.ButtonBuilder()
            .setCustomId(`confirm_legit_link_${message.author.id}`)
            .setLabel('✅ Xác nhận legit')
            .setStyle(discord_js_1.ButtonStyle.Success);
        const row = new discord_js_1.ActionRowBuilder().addComponents(confirmButton);
        try {
            await message.author.send({ embeds: [warningEmbed], components: [row] });
        }
        catch {
            if (message.channel.isTextBased()) {
                await message.channel.send({
                    embeds: [warningEmbed],
                    components: [row],
                    allowedMentions: { parse: [] }
                });
            }
            return true;
        }
    }
    // ==== Automod xử lý vi phạm ====
    if (!violation)
        return false;
    const { reason } = violation;
    await (0, warnSystem_1.warnUser)(message.guild.id, message.author.id, message.client.user.id, reason);
    const warnings = await (0, warnSystem_1.getWarnings)(message.guild.id, message.author.id);
    const warningCount = warnings.length;
    const fine = -Math.pow(2, warningCount - 1) * 50000;
    await (0, economy_1.adjustBalance)(message.guild.id, message.author.id, fine);
    let punishmentMessage = `Bạn đã vi phạm Automod: **${reason}**.`;
    let actionTaken = 'Cảnh cáo và trừ tiền';
    if (warningCount >= 5) {
        await message.member?.ban({ reason: 'Vi phạm Automod quá 5 lần' });
        punishmentMessage += '\n🚫 Bạn đã bị **cấm trong 10 ngày** vì vi phạm quá nhiều lần!';
        await (0, database_1.logInfraction)(message.guild.id, message.author.id, message.client.user.id, 'ban', reason, '10 ngày');
        actionTaken = '🚫 Bị cấm 10 ngày';
    }
    else if (warningCount >= 2) {
        await message.member?.timeout(600000, reason);
        punishmentMessage += '\n🔇 Bạn đã bị **mute trong 10 phút**.';
        await (0, database_1.logInfraction)(message.guild.id, message.author.id, message.client.user.id, 'mute', reason, '10 phút');
        actionTaken = '🔇 Mute 10 phút';
    }
    try {
        await message.author.send(`🚨 **Cảnh báo từ ${message.guild.name}**\n${punishmentMessage}`);
    }
    catch {
        console.warn(`Không thể gửi tin nhắn riêng cho ${message.author.tag}`);
    }
    await message.delete().catch(() => { });
    function sanitizeMentions(content) {
        return content
            .replace(/@everyone/gi, '@\u200Beveryone')
            .replace(/@here/gi, '@\u200Bhere');
    }
    const sanitized = sanitizeMentions(message.content);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle(`🚨 ${getViolationType(reason)}`)
        .setDescription(`**<@${message.author.id}>**, bạn vừa vi phạm quy định!

` +
        `> **Số lần cảnh báo:** \`${warningCount}/5\`
` +
        `> **Tiền phạt:** \`${Math.abs(fine).toLocaleString()} VNĐ\`
` +
        `> **Xử phạt:** ${actionTaken}

` +
        `> **Tin nhắn vi phạm:** ||${sanitized}||`)
        .setFooter({ text: 'Hãy tuân thủ quy định!' })
        .setTimestamp();
    if (message.channel.isTextBased()) {
        await message.channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
    }
    const logChannel = message.guild.channels.cache.get(automodConfig_1.automodConfig.logChannelId);
    if (logChannel) {
        const logEmbed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle(`🚨 Vi Phạm Automod - ${getViolationType(reason)}`)
            .setDescription(`> **Người vi phạm:** <@${message.author.id}>\n` +
            `> **Số lần vi phạm:** ${warningCount}\n` +
            `> **Tin nhắn bị xóa:**\n\`\`\`\n${message.content}\n\`\`\`\n` +
            `> **Lý do:** ${reason}\n` +
            `> **Hình phạt:** ${actionTaken}`)
            .addFields({ name: '📌 Kênh:', value: `<#${message.channel.id}>`, inline: true }, { name: '🆔 Channel ID:', value: message.channel.id, inline: true }, { name: '📅 Thời gian:', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true })
            .setFooter({ text: 'Xử lý bởi hệ thống Automod', iconURL: message.client.user.displayAvatarURL() })
            .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
    }
    return true;
}
function getViolationType(reason) {
    if (reason.includes('từ ngữ không phù hợp'))
        return 'Chửi bậy';
    if (reason.includes('Link invite'))
        return 'Gửi link cấm';
    if (reason.includes('Link scam'))
        return 'Gửi link lừa đảo';
    if (reason.includes('quá nhiều chữ in hoa'))
        return 'Capslock quá mức';
    return 'Vi phạm chat';
}
