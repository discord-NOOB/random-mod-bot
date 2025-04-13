import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../utils/createEmbed';
import { errorHandler } from '../utils/errorHandler';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Clear a number of messages.')
  .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to delete').setRequired(true));

export async function execute(interaction: any) {
  const amount = interaction.options.getInteger('amount');

  if (amount < 1 || amount > 100) {
    return interaction.reply({ content: 'Please provide a number between 1 and 100.', ephemeral: true });
  }

  try {
    await interaction.channel.bulkDelete(amount, true);
    await interaction.reply({ embeds: [createEmbed('Messages Cleared', `${amount} messages have been deleted.`)], ephemeral: true });
  } catch (error) {
    errorHandler(error, interaction);
  }
}
