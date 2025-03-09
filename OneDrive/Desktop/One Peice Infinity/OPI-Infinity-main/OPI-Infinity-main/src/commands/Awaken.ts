import { CommandInteraction, EmbedBuilder } from "discord.js";
import { AWAKENING_MEDALS, MF } from "../constants";
import { sleep, time } from "@jiman24/discordjs-utils";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { calcCooldown, extractOption, getCurrencyEmoji } from "../utils";
import { checkAwakanable } from "../structure/Character";
import { Player } from "../structure/Player";
import { Cooldown } from "../structure/Cooldown";

export default class extends Command {
  name = "awaken";
  description = "To awaken a character.";

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.get(i.user.id);
    if (!player.selected.character) {
      throw new CommandError("Select a character first.");
    }

    const characterId = player.selected.character.id;
    if (!checkAwakanable(characterId)) {
      const embed = new EmbedBuilder()
        .setColor("Random")
        .addFields(
          { name: "Awakening Info", value: `It is a special ability of few characters to awaken themselves to gain a 10% boost on every stat ${MF}` },
          { name: "The Cost", value: `Each try costs 1000 Awakening-Medals ${AWAKENING_MEDALS}. The chances of awakening increase as the number of failures increase. Use \`/awaken-streak\` to know your chances of success.` },
          { name: "Awakenable Characters", value: "Zoro King of Hell" }
        )
        .setFooter({ text: "Use /awaken on the listed characters" });

      await i.editReply({ content: "`[This character can't be awakened]`", embeds: [embed] });
      return;
    }

    const awake = player.characters.find(x => x.productionNumber === player.selected.character?.productionNumber)?.awaken;
    if (awake === 1) {
      await i.editReply("You've already **awakened** the character.");
      return;
    }

    const cd = await Cooldown.get(i.user.id, `awaken`);
    const cooldown = calcCooldown(time.SECOND * 10, cd, true);
    if (!cooldown.finished) {
      const countdown = cooldown.timeLeft;
      throw new CommandError(`<:timer_2:1238099180199870545> Try again <t:${countdown}:R>`);
    }

    const productionNumber = player.selected.character.productionNumber;
    const bal = player.getBalance("awakening-medals");
    if (bal.amount < 1000) {
      throw new CommandError(`You need ${1000 - bal.amount}${getCurrencyEmoji("awakening-medals")} more to awaken!`);
    }

    const baseChance = 0.0025;
    const additionalChance = player.st * 0.0025;
    const chance = Math.random() < (baseChance + additionalChance);

    const embed = new EmbedBuilder()
      .setTitle("Charging Awakening")
      .setDescription(`☠ Hold fast, adventurer! The ancient energies of the Grand Line are converging. You stand at the brink of untold power, daring to unleash the full potential within. Your spirit calls forth the awakening of abilities that could change the course of your saga. ☠\n${MF} ${MF} Prepare your heart and steel your resolve—let the dance with fate begin! ${MF} ${MF}`)
      .setImage("https://files.catbox.moe/9tp76g.gif");

    await i.editReply({ embeds: [embed] });
    await sleep(time.SECOND * 7);

    player.withdraw("awakening-medals", 1000);

    if (!chance) {
      player.st += 1;
      embed
        .setColor("Red")
        .setTitle("Awakening Failed")
        .setDescription(`${MF} Brave soul! The seas of fate are fickle; today, they have not favored your bold attempt. Fear not, for every setback is but a prelude to a grander victory. Your journey towards awakening is fraught with trials, but remember—true power lies in perseverance. ${MF}`)
        .setImage("https://files.catbox.moe/juui2w.gif")
        .setFooter({ text: "Better luck next time, son..\nFail Streak Updated +1" });
    } else {
      player.awaken(characterId, productionNumber);
      player.st = 0;
      embed
        .setColor("Random")
        .setTitle("Character Awakened")
        .setDescription(`${MF} ${MF} ${MF} Behold the Seas, Pirates! Your powers have transcended! With a roar louder than the oceans, your Character has awakened! Embrace this mighty surge of strength, and let the world know that a new legend sails among them!" ${MF} ${MF} ${MF}`)
        .setImage("https://files.catbox.moe/ine4p8.gif");
    }

    await player.save();
    await i.editReply({ embeds: [embed] });

    const cooldownObj = new Cooldown(Cooldown.makeCooldown(i.user.id));
    await cooldownObj.set(i.user.id, `awaken`, new Date());
    await cooldownObj.save();
  }
}