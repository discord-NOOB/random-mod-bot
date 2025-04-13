import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';
import sendLog from '../utils/sendLog';
import { createEmbed } from '../utils/createEmbed';
import { errorHandler } from '../utils/errorHandler';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mute a member in the server.')
  .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true));

export async function execute(interaction: any) {
  const user = interaction.options.getUser('user');

  try {
    const member = await interaction.guild.members.fetch(user.id);
    const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');

    if (!muteRole) {
      return interaction.reply({ content: 'Muted role not found.', ephemeral: true });
    }

    await member.roles.add(muteRole);
    await interaction.reply({ embeds: [createEmbed('Member Muted', `${user.tag} has been muted.`)] });
    sendLog(interaction.guild, `Member Muted: ${user.tag}`);
  } catch (error) {
    errorHandler(error, interaction);
  }
}
