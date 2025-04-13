import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check the bot\'s latency.');

export async function execute(interaction: any) {
  await interaction.reply({ content: `Pong! Latency: ${Date.now() - interaction.createdTimestamp}ms` });
}
