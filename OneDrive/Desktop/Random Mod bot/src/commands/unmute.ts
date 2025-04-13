import { SlashCommandBuilder } from 'discord.js';
import sendLog from '../utils/sendLog';
import { createEmbed } from '../utils/createEmbed';
import { errorHandler } from '../utils/errorHandler';

export const data = new SlashCommandBuilder()
  .setName('unmute')
  .setDescription('Unmute a member in the server.')
  .addUserOption(option => option.setName('user').setDescription('User to unmute').setRequired(true));

export async function execute(interaction: any) {
  const user = interaction.options.getUser('user');

  try {
    const member = await interaction.guild.members.fetch(user.id);
    const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');

    if (!muteRole) {
      return interaction.reply({ content: 'Muted role not found.', ephemeral: true });
    }

    await member.roles.remove(muteRole);
    await interaction.reply({ embeds: [createEmbed('Member Unmuted', `${user.tag} has been unmuted.`)] });
    sendLog(interaction.guild, `Member Unmuted: ${user.tag}`);
  } catch (error) {
    errorHandler(error, interaction);
  }
}
