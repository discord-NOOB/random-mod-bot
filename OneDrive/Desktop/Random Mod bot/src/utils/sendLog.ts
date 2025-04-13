import { Client, TextChannel } from 'discord.js';

export async function sendLog(client: Client, message: string) {
  const logChannel = client.channels.cache.find(
    channel => channel.isTextBased() && channel.name === 'bot-logs'
  ) as TextChannel | undefined;

  if (logChannel) {
    await logChannel.send({ content: message });
  }
}
