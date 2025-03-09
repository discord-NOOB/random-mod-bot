import { CommandInteraction, EmbedBuilder } from "discord.js";
import { MF } from "../constants";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { Player } from "../structure/Player";

export default class extends Command {
  name = "awaken-streak";
  description = "View your current awaken streak and chance of success.";

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.get(i.user.id);
    const currentStreak = player.st || 0;

    const baseChance = 0.0025;
    const additionalChance = currentStreak * 0.0025;
    const totalChance = (baseChance + additionalChance) * 100;

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setTitle("Awakening Streak Information")
      .addFields(
        { name: "Current Streak", value: `**${currentStreak}** failures so far`, inline: true },
        { name: "Next Success Chance", value: `**${totalChance.toFixed(2)}%** chance of success on the next attempt`, inline: true }
      )
      .setDescription(`${MF} Your journey toward awakening is filled with trials, but every failure brings you closer to victory! Each failed attempt increases your odds for success. Never lose hope, and keep pushing forward! ${MF}`)
      .setFooter({ text: "Good luck on your next attempt!" });

    await i.editReply({ embeds: [embed] });
  }
}