import { SlashCommandBuilder } from 'discord.js';
import sendLog from '../utils/sendLog';
import { createEmbed } from '../utils/createEmbed';
import { errorHandler } from '../utils/errorHandler';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kick a member from the server.')
  .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for kick'));

export async function execute(interaction: any) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';

  try {
    const member = await interaction.guild.members.fetch(user.id);
    await member.kick(reason);
    await interaction.reply({ embeds: [createEmbed('Member Kicked', `${user.tag} has been kicked.\nReason: ${reason}`)] });
    sendLog(interaction.guild, `Member Kicked: ${user.tag} | Reason: ${reason}`);
  } catch (error) {
    errorHandler(error, interaction);
  }
}
