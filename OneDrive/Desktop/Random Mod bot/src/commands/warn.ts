import { SlashCommandBuilder } from 'discord.js';
import { sendLog } from '../utils/sendLog';
import { createEmbed } from '../utils/createEmbed';
import { errorHandler } from '../utils/errorHandler';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Warn a member in the server.')
  .addUserOption(option => option.setName('user').setDescription('User to warn').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for warning'));

export async function execute(interaction: any) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';

  try {
    await interaction.reply({ embeds: [createEmbed('Member Warned', `${user.tag} has been warned.\nReason: ${reason}`)] });
    sendLog(interaction.guild, `Member Warned: ${user.tag} | Reason: ${reason}`);
  } catch (error) {
    errorHandler(error, interaction);
  }
}
