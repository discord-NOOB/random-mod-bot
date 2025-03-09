import { Command } from "@jiman24/slash-commandment";
import { 
  ActionRowBuilder, 
  CommandInteraction, 
  EmbedBuilder, 
  StringSelectMenuBuilder, 
  InteractionCollector,
  ComponentType 
} from "discord.js";
import { Player } from "../structure/Player";

export default class extends Command {
  name = "bal";
  description = "Show balance of every currency";

  allowedUserIds = [
    "428259221017198592","207787751368687616","881113828195205131", 
    "231838951265140738", "951105329528180786","927606661789675581","989893952813555732","784786568489467905" 
    "882029389842382898", "993570902820257812"
  ];

  constructor() {
    super();

    this.addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("User to check the balance of (admin-only)")
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();
    if (!i.isChatInputCommand()) return
    const isAllowedUser = this.allowedUserIds.includes(i.user.id);
    const targetUser = i.options.getUser("user");

    const player = isAllowedUser && targetUser 
      ? await Player.get(targetUser.id) 
      : await Player.get(i.user.id);

    const { embed, selectMenu } = player.showBalance(i.user.displayAvatarURL());
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const message = await i.editReply({
      embeds: [embed],
      components: [row],
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== i.user.id) {
        interaction.reply({
          content: "You can't interact with this menu!",
          ephemeral: true,
        });
        return;
      }

      const selectedCategory = interaction.values[0];
      const { embed, selectMenu } = player.showBalance(i.user.displayAvatarURL(), selectedCategory);
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.update({
        embeds: [embed],
        components: [row],
      });
    });

    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(selectMenu.setDisabled(true));
      
      await message.edit({
        components: [disabledRow],
      });
    });
  }
}
