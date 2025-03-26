import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { setPrefix } from '../../config/config';

export const setPrefixCommand = {
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('🔧 Thay đổi prefix của bot trong server.')
        .addStringOption(option => 
            option.setName('prefix')
                .setDescription('Prefix mới cho bot (ví dụ: ! hoặc -)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        // Kiểm tra quyền admin
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '🚫 Bạn cần quyền **Quản trị viên** để thay đổi prefix.', ephemeral: true });
        }

        const newPrefix = interaction.options.getString('prefix', true);

  setPrefix(newPrefix);

        return interaction.reply({ content: `✅ Prefix đã được cập nhật thành **\`${newPrefix}\`**`, ephemeral: false });
    },
};

export default setPrefixCommand;
