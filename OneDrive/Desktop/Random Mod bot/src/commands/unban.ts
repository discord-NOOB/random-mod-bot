import { SlashCommandBuilder } from 'discord.js';
import sendLog from '../utils/sendLog';
import { createEmbed } from '../utils/createEmbed';
import { errorHandler } from '../utils/errorHandler';

export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Unban a user from the server.')
  .addStringOption(option => option.setName('userid').setDescription('User ID to unban').setRequired(true));

export async function execute(interaction: any) {
  const userId = interaction.options.getString('userid');

  try {
    await interaction.guild.bans.remove(userId);
    await interaction.reply({ embeds: [createEmbed('User Unbanned', `User with ID ${userId} has been unbanned.`)] });
    sendLog(interaction.guild, `User Unbanned: ${userId}`);
  } catch (error) {
    errorHandler(error, interaction);
  }
}
