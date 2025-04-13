import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../utils/createEmbed';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('List all available commands.');

export async function execute(interaction: any) {
  const helpText = `
  **Moderation Commands:**
  - \`/ban\`
  - \`/kick\`
  - \`/mute\`
  - \`/unmute\`
  - \`/warn\`
  - \`/clear\`
  - \`/unban\`
  - \`/help\`
  `;

  await interaction.reply({ embeds: [createEmbed('Help - Commands List', helpText)] });
}
