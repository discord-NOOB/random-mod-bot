import { EmbedBuilder } from 'discord.js';

export function createEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('#5865F2')
    .setTimestamp();
}
