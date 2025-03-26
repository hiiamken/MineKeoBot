import { GuildMember } from 'discord.js';
import { removeUserVerification } from '../database/verifyLog';

export async function onGuildMemberRemove(member: GuildMember) {
  await removeUserVerification(member.id);
}