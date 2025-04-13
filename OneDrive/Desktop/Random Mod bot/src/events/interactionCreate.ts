import { Events } from 'discord.js';

export const name = Events.InteractionCreate;
export const execute = async (interaction: any, client: any) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
  }
};
