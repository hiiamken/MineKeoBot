// src/admincommands/slash/whitelist.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { updateSecurityConfig } from '../../utils/updateSecurityConfig';
import config from '../../config/securityConfig';

export const whitelist = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Thêm hoặc gỡ user/role khỏi whitelist')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Thêm vào whitelist')
        .addUserOption((opt) =>
          opt.setName('user').setDescription('Người dùng cần thêm').setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role cần thêm').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Gỡ khỏi whitelist')
        .addUserOption((opt) =>
          opt.setName('user').setDescription('Người dùng cần gỡ').setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role cần gỡ').setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
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
      ? [...config.antiNuke.whitelistedUsers]
      : [...config.antiNuke.whitelistedRoles];

    if (sub === 'add') {
      if (!list.includes(id)) list.push(id);
    } else {
      const index = list.indexOf(id);
      if (index !== -1) list.splice(index, 1);
    }

    await updateSecurityConfig({
      antiNuke: {
        ...(config.antiNuke as any),
        whitelistedUsers: isUser ? list : config.antiNuke.whitelistedUsers,
        whitelistedRoles: !isUser ? list : config.antiNuke.whitelistedRoles,
      },
    });

    return interaction.reply({
      content: `${sub === 'add' ? '✅ Thêm' : '🗑️ Gỡ'} ${isUser ? `user <@${id}>` : `role <@&${id}>`} ${sub === 'add' ? 'vào' : 'khỏi'} whitelist thành công.`,
      ephemeral: true,
    });
  },
};
