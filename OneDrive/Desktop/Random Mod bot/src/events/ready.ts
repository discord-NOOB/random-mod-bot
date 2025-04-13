export async function execute(client: any) {
  console.log(`Bot is ready as ${client.user.tag}`);
}

export const name = 'ready';
export const once = true;
