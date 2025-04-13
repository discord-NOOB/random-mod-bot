import { Message } from 'discord.js';

export async function execute(message: Message) {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    await message.reply('Pong!');
  }
}

export const name = 'messageCreate';
export const once = false;
