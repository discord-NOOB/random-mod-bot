import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction } from 'discord.js';
import { createEmbed } from '../utils/createEmbed';
import { sendLog } from '../utils/sendLog';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a member')
  .addUserOption(option => option.setName('user').setDescription('User to ban').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for ban'))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: CommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';

  const member = await interaction.guild?.members.fetch(user.id);
  if (!member) {
    return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
  }

  await member.ban({ reason });
  await interaction.reply({ embeds: [createEmbed('User Banned', `${user.tag} was banned. Reason: ${reason}`)] });

  sendLog(interaction.client, `Member Banned: ${user.tag} | Reason: ${reason}`);
}
