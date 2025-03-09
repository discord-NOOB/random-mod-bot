import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { Character } from "../structure/Character";
import { Ability } from "../structure/Ability";
import { DAMAGE, HEALER_ROLE, STAMINA } from "../constants";
import { Player } from "../structure/Player";

export default class extends Command {
  name = "ability";
  description = "View character abilities";

  constructor() {
    super();
    this.addStringOption((opt) =>
      opt.setName("name").setDescription("Character name").setRequired(false)
    );
  }

  async exec(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
      const player = await Player.get(interaction.user.id);
      let characterName = interaction.options.getString("name") || player.selected.character?.name;

      if (!characterName) {
        throw new CommandError("You must specify a character name or select a character.");
      }

      const character = await this.searchCharacter(characterName);
      if (!character) {
        throw new CommandError(`Character "${characterName}" not found.`);
      }

      const abilities = await Promise.all(character.abilities.map((id) => Ability.get(id)));

      if (character.name === "Unohana (Kenpachi)") {
        const damageValues = [175, 200, 210, 230];
        abilities.forEach((ability, index) => {
          if (index < damageValues.length) {
            ability.damage = damageValues[index];
          }
        });
      }

      const embed = this.buildAbilitiesEmbed(character, abilities);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      if (error instanceof CommandError) {
        await interaction.followUp({ content: error.message, ephemeral: true });
      } else {
        await interaction.followUp({ content: "An unexpected error occurred.", ephemeral: true });
      }
    }
  }

  private async searchCharacter(search: string): Promise<Character | undefined> {
    const characters = await Character.all();
    return characters.find((char) => char.name.toLowerCase() === search.toLowerCase());
  }

  private buildAbilitiesEmbed(character: Character, abilities: Ability[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Abilities",
        iconURL:
          "https://images-ext-1.discordapp.net/external/uMlyLEEGxBrGRdNE9Wf6qUnnz_wqqTo4OD-ksjfhNvI/https/cdn.discordapp.com/emojis/816917601678655548.png?format=webp&quality=lossless&width=80&height=80",
      })
      .setTitle(character.name)
      .setFooter({
        text: "- Buttons in PvP represent each move\n- Example: Button 1 stands for first move",
      })
      .setColor("Green");

    abilities.forEach((ability, index) => {
      const powerBar = this.getPowerBarEmoji(ability);
      let typeText = `Type:`;

      if (ability.type === "special-attack") {
        typeText += ` ${DAMAGE} \` SPA \` | Power: \` ${ability.damage} \``;
      } else if (ability.type === "heal") {
        typeText += ` ${HEALER_ROLE} \` Heal \` | Power: \` ${ability.heal} \``;
      } else if (ability.type === "stamina-charge") {
        typeText += ` ${STAMINA} \` Stamina \` | Power: \` ${ability.staminaCharge} \``;
      }

      embed.addFields({
        name: `${index + 1}) ${ability.name}`,
        value: `${typeText}\n<:down:1197505153255870496><:blue_bar_left:1324781337541873775>${powerBar}<:bbr:1325115869759537233>`,
        inline: false,
      });
    });

    return embed;
  }

  private getPowerBarEmoji(ability: Ability): string {
    const maxEmojiLimit = 50;
    let powerBarCount = 0;

    switch (ability.type) {
      case "special-attack":
        powerBarCount = Math.min(Math.floor(ability.damage / 55), maxEmojiLimit);
        break;
      case "heal":
        powerBarCount = Math.min(Math.floor(ability.heal / 55), maxEmojiLimit);
        break;
      case "stamina-charge":
        powerBarCount = Math.min(Math.floor(ability.staminaCharge / 55), maxEmojiLimit);
        break;
      default:
        powerBarCount = Math.min(Math.floor(ability.staminaCost / 55), maxEmojiLimit);
    }

    return "<:blue_bar_middle:1324781340624818297>".repeat(powerBarCount);
  }
}
