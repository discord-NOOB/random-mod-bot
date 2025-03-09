import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Interaction,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { Player } from "../structure/Player";
import { calcCooldown, getCurrencyEmoji } from "../utils";
import { progressBar } from '@jiman24/discordjs-utils';
import { BERRYS, HAKI_MEDALS, Invisible, POWER, SOUL_DUST, SPEED, TWINKLING } from '../constants';
import { Cooldown } from "../structure/Cooldown";

export default class extends Command {
  name = "adventure";
  description = "To go for adventures";

  private islands = [
    { island: "lantern island", value: 10000, berries: 50000, item: false },
    { island: "neko island (cat)", value: 12000, berries: 100000, item: false },
    { island: "thicket island", value: 14000, berries: 125000, item: false },
    { island: "kimono island", value: 18000, berries: 150000, item: false },
    { island: "escape island", value: 19000, berries: 175000, item: true },
    { island: "monument island", value: 20000, berries: 200000, item: true },
    { island: "chokoku island", value: 21000, berries: 225000, item: true },
    { island: "quicksand island", value: 22000, berries: 250000, item: true },
    { island: "ghost island", value: 23000, berries: 275000, item: true },
    { island: "champion island", value: 24000, berries: 350000, item: true },
  ];

  private getValueByIslandName(name: string) {
    const island = this.islands.find(item => item.island === name.toLowerCase());
    return island ? island.value : null;
  }

  private getBerries(name: string) {
    const island = this.islands.find(item => item.island === name.toLowerCase());
    return island ? island.berries : null;
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();
    let player = await Player.get(i.user.id);
    player.checkTrade();

    const cd = await Cooldown.get(i.user.id, `adventure`);
    const cooldown = calcCooldown(240 * time.MINUTE, cd, true);

    if (player.island === "NoIsland") {
      player.adventure = false;
      await player.save();
    }

    if (player.adventure) {
      const currentTime = Date.now();
      const lastCommandUsageTime = cd;
      const timeDifference = currentTime - lastCommandUsageTime;
      const timeSpentInSeconds = Math.floor(timeDifference / 1000);
      const percent = (timeSpentInSeconds / 10800) * 100;
      const p = Math.round(percent);

      const islandberry = this.getBerries(player.island);
      const island_power_level = this.getValueByIslandName(player.island);

      if (!islandberry || !island_power_level) {
        throw new CommandError("Something fishy, DM the owner.");
      }

      const total_power = await this.calculateTotalPower(player);
      const MaxReach = (total_power / island_power_level) * 100;
      const Mr = Math.round(MaxReach);

      if (p >= Mr && Mr < 100) {
        await this.handleBustedAdventure(i, player, Mr, islandberry);
      } else if (p >= 100) {
        await this.handleCompletedAdventure(i, player, islandberry);
      } else {
        await this.handleOngoingAdventure(i, player, p, islandberry);
      }
    } else {
      if (!cooldown.finished) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: "Adventure", iconURL: "https://cdn.discordapp.com/emojis/1158666136540418048.webp?size=128&quality=lossless" })
          .setDescription(`You can go for adventure again after <t:${cooldown.timeLeft}:R>`)
          .setColor("Red");
        await i.editReply({ embeds: [embed] });
        return;
      }

      await this.startAdventure(i, player);
    }
  }

  private async calculateTotalPower(player: Player) {
    const selectedCrew = player.crews.find(crew => crew.selected);
    if (!selectedCrew) {
      throw new CommandError("You've not selected a Crew. Use `/crew select` to select a crew.");
    }

    const crew = player.findCrew(selectedCrew.name);
    if (crew.length === 0) {
      throw new CommandError("You've not yet added a character. Use `/crew add` to add characters to the crew.");
    }

    let total_power = 0;
    for (const char of crew) {
      const haki = player.getHaki(char.id, char.productionNumber);
      const stats = await StatsCalculator(char.level, char.id, haki);
      total_power += stats.damage + stats.defense + stats.health + stats.speed;
    }

    return total_power;
  }

  private async handleBustedAdventure(i: CommandInteraction, player: Player, Mr: number, islandberry: number) {
    const cb = Math.round((islandberry / 100) * Mr);
    const rewards = new EmbedBuilder()
      .setAuthor({ name: i.user.username, iconURL: i.user.displayAvatarURL() })
      .setColor("DarkRed")
      .addFields(
        { name: `Progress ${SPEED}`, value: `-# ${luffyBar(Mr, 100, 9)}\n${progressBar(Mr, 100, 8)}[${Mr}%]\n${down}Status: \`[BUSTED]\`` },
        { name: `${TWINKLING}Gained${TWINKLING}`, value: `${qx} Berrys - x${cb}${BERRYS}\n${down} Soul-Dust - x${Math.round(cb / 300)}${SOUL_DUST}` }
      )
      .setThumbnail("https://files.catbox.moe/ejnnma.gif")
      .setTimestamp()
      .setFooter({ text: "Failed" });

    const claim = new ButtonBuilder()
      .setCustomId("claim")
      .setLabel("Claim")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(claim);
    await i.editReply({ embeds: [rewards], components: [row] });

    const collector = (i.channel as TextChannel).createMessageComponentCollector({ filter: (int) => int.user.id === i.user.id, time: 50000 });
    collector.on('collect', async (int) => {
      if (int.customId === "claim") {
        rewards.setFooter({ text: "Claimed" });
        rewards.setColor("Red");
        await i.editReply({ embeds: [rewards], components: [] });
        await int.reply(`<:op_fist_luffy:1138103506113396756> Unfortunately, you lost your adventure.\nYou've obtained${TWINKLING} **${BERRYS} ${cb} Berrys, ${SOUL_DUST} ${Math.round(cb / 300)} Soul Dust**\n*"Better luck next time.."*`);
        player.deposit("berrys", cb);
        player.deposit("soul-dust", Math.round(cb / 300));
        player.adventure = false;
        await player.save();
      }
    });
  }

  private async handleCompletedAdventure(i: CommandInteraction, player: Player, islandberry: number) {
    const rewards = new EmbedBuilder()
      .setAuthor({ name: i.user.username, iconURL: i.user.displayAvatarURL() })
      .setColor("DarkGreen")
      .addFields(
        { name: `Progress ${SPEED}`, value: `-# ${luffyBar(100, 100, 9)}\n${progressBar(100, 100, 8)}[100%]\n${down}Status: \`[COMPLETED]\`` },
        { name: `${TWINKLING}Gained${TWINKLING}`, value: `${qx} Berrys - x${islandberry}${BERRYS}\n${qx} Soul-Dust - x${Math.round(islandberry / 300)}${SOUL_DUST}\n${down} Haki-Medals - ${Math.round(islandberry / 125)}${HAKI_MEDALS}` }
      )
      .setThumbnail("https://files.catbox.moe/ejnnma.gif")
      .setTimestamp()
      .setFooter({ text: "Completed" });

    const claim = new ButtonBuilder()
      .setCustomId("claim")
      .setLabel("Claim")
      .setStyle(ButtonStyle.Success);

    const claim2 = new ButtonBuilder()
      .setCustomId("claim2")
      .setLabel("x1.1")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(claim, claim2);
    await i.editReply({ embeds: [rewards], components: [row] });

    const collector = (i.channel as TextChannel).createMessageComponentCollector({ filter: (int) => int.user.id === i.user.id, time: 50000 });
    collector.on('collect', async (int) => {
      if (int.customId === "claim") {
        rewards.setFooter({ text: "Claimed" });
        rewards.setColor("Green");
        await i.editReply({ embeds: [rewards], components: [] });
        await int.reply(`<:op_fist_luffy:1138103506113396756> Congratulations on your adventure!\nYou've obtained${TWINKLING} **${BERRYS} ${islandberry} Berrys, ${HAKI_MEDALS} ${Math.round(islandberry / 125)} Haki Medals, ${SOUL_DUST} ${Math.round(islandberry / 300)} Soul Dust**`);
        player.deposit("berrys", islandberry);
        player.deposit("haki-medals", Math.round(islandberry / 125));
        player.deposit("soul-dust", Math.round(islandberry / 300));
        player.adventure = false;
        await player.save();
      } else if (int.customId === "claim2") {
        const guild = i.client.guilds.cache.get("1007501808903651398");
        const user = await guild?.members.fetch(i.user.id);
        if (!user || !user.roles.cache.has("1177908010312544356")) {
          await int.reply({ content: "You don't have a premium subscription!", ephemeral: true });
          return;
        }

        rewards.setFooter({ text: "Premium Claimed" });
        rewards.setColor("Green");
        await i.editReply({ embeds: [rewards], components: [] });
        await int.reply(`<:op_fist_luffy:1138103506113396756> Congratulations on your adventure!\nYou've obtained${TWINKLING} **${BERRYS} ${Math.round(islandberry * 1.1)} Berrys, ${HAKI_MEDALS} ${Math.round((islandberry / 125) * 1.1)} Haki Medals, ${SOUL_DUST} ${Math.round((islandberry / 300) * 1.1)} Soul Dust**`);
        player.deposit("berrys", Math.round(islandberry * 1.1));
        player.deposit("haki-medals", Math.round((islandberry / 125) * 1.1));
        player.deposit("soul-dust", Math.round((islandberry / 300) * 1.1));
        player.adventure = false;
        await player.save();
      }
    });
  }

  private async handleOngoingAdventure(i: CommandInteraction, player: Player, p: number, islandberry: number) {
    const cb = Math.round((islandberry / 100) * p);
    const embed = new EmbedBuilder()
      .setAuthor({ name: i.user.username, iconURL: i.user.displayAvatarURL() })
      .setColor("Yellow")
      .addFields(
        { name: `Progress ${SPEED}`, value: `-# ${luffyBar(p, 100, 9)}\n${progressBar(p, 100, 8)}[${p}%]\n${down} Status: \`[ONGOING]\`` },
        { name: `${TWINKLING}Gained${TWINKLING}`, value: `${qx} Berrys - x${cb}${getCurrencyEmoji("berrys")}\n${down} Soul-Dust - x${Math.round(cb / 300)}${getCurrencyEmoji("soul-dust")}` }
      )
      .setThumbnail("https://files.catbox.moe/ejnnma.gif")
      .setTimestamp()
      .setFooter({ text: "Pending" });

    const flee = new ButtonBuilder()
      .setCustomId("flee")
      .setLabel("Flee")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(flee);
    await i.editReply({ embeds: [embed], components: [row] });

    const collector = (i.channel as TextChannel).createMessageComponentCollector({ filter: (int) => int.user.id === i.user.id, time: 50000 });
    collector.on('collect', async (int) => {
      if (int.customId === "flee") {
        embed.setColor("DarkOrange");
        embed.setFooter({ text: "Fled" });
        await i.editReply({ embeds: [embed], components: [] });
        await int.reply(`You decided to flee 🏃‍♂️💨 at **${p}%**\nYou've obtained${TWINKLING} **${BERRYS}${cb} Berrys, ${SOUL_DUST} ${Math.round(cb / 300)} Soul Dust** \n*"Don't worry, you shall complete next time"*`);
        player.deposit("berrys", cb);
        player.deposit("soul-dust", Math.round(cb / 300));
        player.adventure = false;
        await player.save();
      }
    });
    collector.on('end', async () => {
      await i.editReply({ components: [] });
    });
  }

  private async startAdventure(i: CommandInteraction, player: Player) {
    const explore = new EmbedBuilder()
      .setAuthor({ name: "Adventure", iconURL: "https://cdn.discordapp.com/emojis/1158666136540418048.webp?size=128&quality=lossless" })
      .setDescription("🟢 - Easy\n🟠 - Medium\n🔴 - Hard")
      .setColor("#854b0a")
      .setFooter({ text: "Choosing Difficulty" })
      .setTimestamp();

    const difficultyMenu = new StringSelectMenuBuilder()
      .setCustomId('difficulty')
      .setPlaceholder('Select difficulty')
      .addOptions([
        { label: 'Easy', description: 'Easy difficulty', value: 'easy', emoji: '🟢' },
        { label: 'Medium', description: 'Medium difficulty', value: 'medium', emoji: '🟠' },
        { label: 'Hard', description: 'Hard difficulty', value: 'hard', emoji: '🔴' },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(difficultyMenu);
    await i.followUp({ embeds: [explore], components: [row] });

    const collector = (i.channel as TextChannel).createMessageComponentCollector({ filter: (int) => int.user.id === i.user.id, time: 60000 });
    collector.on('collect', async (int) => {
      if (int.isStringSelectMenu() && int.customId === 'difficulty') {
        await int.deferUpdate();
        const difficulty = int.values[0];
        const embed = this.createDifficultyEmbed(difficulty);
        const islandMenu = this.createIslandMenu(difficulty);

        const islandRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(islandMenu);
        await i.editReply({ embeds: [embed], components: [islandRow] });
      } else if (int.isStringSelectMenu() && int.customId.endsWith('_island')) {
        const chosenIsland = this.getIslandName(int.values[0]);
        const finalEmbed = new EmbedBuilder()
          .setAuthor({ name: "Adventure", iconURL: "https://cdn.discordapp.com/emojis/1158666136540418048.webp?size=128&quality=lossless" })
          .setTitle("Adventure Begins!")
          .setDescription(`You've chosen to explore:\n<:i:1326577946324111410> **${chosenIsland}**`)
          .addFields(
            { name: "Tips", value: "> Make sure you have a **good** crew\n> Use `/crew view` to view your crew!", inline: false },
            { name: `Progress ${SPEED}`, value: "> Use `/adventure` again to see the progress", inline: false }
          )
          .setColor("Random")
          .setTimestamp()
          .setFooter({ text: "Started" })
          .setImage("https://files.catbox.moe/0ib8mz.webp");

        await i.editReply({ embeds: [finalEmbed], components: [] });

        const cooldown = new Cooldown(Cooldown.makeCooldown(i.user.id));