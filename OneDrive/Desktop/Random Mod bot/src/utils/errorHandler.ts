import { CommandInteraction, Message } from 'discord.js';

export function errorHandler(error: unknown, interaction?: CommandInteraction | Message) {
  console.error('An error occurred:', error);

  if (interaction && interaction instanceof CommandInteraction) {
    if (interaction.replied || interaction.deferred) {
      interaction.followUp({ content: 'An unexpected error occurred.', ephemeral: true });
    } else {
      interaction.reply({ content: 'An unexpected error occurred.', ephemeral: true });
    }
  }
}
