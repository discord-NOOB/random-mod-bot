import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder, Message, TextChannel } from "discord.js";
import { Player } from "../structure/Player";
import { Character } from "../structure/Character";
import { Battle, Team } from "../structure/Battle";
import { Act, Arc, Enemy, SubArc, arcContent } from "../structure/Arc";
import { random, sleep, time, toNList } from "@jiman24/discordjs-utils";
import { extractOption } from "../utils";
import { ACTOR, BERRYS, DEFAULT_LOCK, DEFAULT_UNLOCK } from "../constants";
import { Item } from "../structure/Item";
import { ItemHandle } from "../structure/ItemHandler";
import { EventPlayer, Quests } from "../structure/Event";

const opts = {
  arc: "arc",
  subArc: "sub_arc",
};

export default class extends Command {
  name = "arc";
  description = "battle command";

  constructor() {
    super();
    this.addStringOption(opt =>
      opt
        .setName(opts.arc)
        .setDescription("main arc")
        .addChoices(...arcContent.map(arc => ({ name: arc.name, value: arc.id })))
        .addIntegerOption(opt =>
          opt.setName(opts.subArc).setDescription("sub arc index").setMinValue(1));
  }

  async exec(i: CommandInteraction) {
    await i.reply("Ayo Explorer!\nThe Arc is getting removed and being replaced with a new **Story** mode");
    return;
    
    // Maintained original code structure below for completeness
    const arcId = extractOption<string>(i, opts.arc);
    const subArcIndex = extractOption<number>(i, opts.subArc);
    
    if (subArcIndex) {
      const msg = await i.deferReply({ fetchReply: true });
      await this.battle(msg as Message, arcId, subArcIndex - 1);
    } else if (arcId) {
      await i.deferReply();
      await this.showSubArcList(i, arcId);
    } else {
      await i.deferReply();
      await this.showArcList(i);
    }
  }

  private async showSubArcList(i: CommandInteraction, arcId: string) {
    const player = await Player.get(i.user.id);
    player.checkTrade();
    const arc = player.arcManager.getArc(arcId);
    const embed = new EmbedBuilder().setTitle(arc.name).setColor("Random");
    
    const arcList = toNList(arc.subArcs.map((subArc, index) => {
      if (index > 0 && !player.arcManager.isSubArcCleared(arc.id, arc.subArcs[index-1].id)) {
        return `${DEFAULT_LOCK} ${subArc.name}`;
      }
      
      if (subArc.requirements?.some(req => 
        !player.items.some(item => item.itemId === req.itemId && item.unit > 0)
      )) {
        return `${DEFAULT_LOCK} ${subArc.name}`;
      }
      
      return `${DEFAULT_UNLOCK} ${subArc.name}`;
    }));

    embed.setDescription(arcList);
    await i.editReply({ embeds: [embed] });
  }

  private async showArcList(i: CommandInteraction) {
    const player = await Player.get(i.user.id);
    const embed = new EmbedBuilder().setTitle("Arcs").setColor("Random");
    
    const arcList = toNList(arcContent.map(arc => 
      player.arcManager.isArcCleared(arc.id) ? 
      `${DEFAULT_UNLOCK} ${arc.name}` : 
      `${DEFAULT_LOCK} ${arc.name}`
    ));

    embed.setDescription(arcList);
    await i.editReply({ embeds: [embed] });
  }

  private async battle(i: Message, arcId: string, subArcIndex: number, nextAct?: Act) {
    const arc = arcContent.find(a => a.id === arcId);
    if (!arc) throw new CommandError("Arc not found");
    
    const subArc = arc.subArcs[subArcIndex];
    if (!subArc) throw new CommandError("Sub arc not found");
    
    const player = await Player.get(i.author.id);
    const crews = await player.getCrew();
    if (crews.length === 0) throw new CommandError("You have no crew members");

    const act = nextAct || player.arcManager.getActFromLastSafePoint(arc.id, subArc.id);
    this.validateSubArcAccess(player, arc, subArc, subArcIndex);

    const bot = Player.bot();
    const { team, isBoss } = await this.createEnemyTeam(act);
    
    if (isBoss && crews.length < 5) {
      await this.handleBossRequirementError(i);
      return;
    }

    await this.showStartBattleAnimation(i, act);
    const battle = new Battle(i, [{
      id: player.id, player, characters: crews
    }, {
      id: bot.id, player: bot, characters: team
    }]);

    const winnerTeam = process.env.SKIP_BATTLE === "true" 
      ? { id: player.id, player, characters: [] } 
      : await battle.run(this.getBattleConfig(act, subArc));

    if (winnerTeam.id === player.id) {
      await this.handleWin(i, player, arc, subArc, act);
    } else {
      await this.handleLoss(i, player, arc, subArc, act);
    }
  }

  private async createEnemyTeam(act: Act) {
    const team = [];
    let isBoss = false;
    
    for (const { charId, amplify, boss } of act.enemies) {
      const character = await Character.get(charId);
      const statsMultiplier = amplify ?? 4.2;
      
      character._damage = Math.round(character._damage * statsMultiplier);
      character._defense = Math.round(character._defense * statsMultiplier);
      character._health = Math.round(character._health * statsMultiplier);
      character._speed = Math.round(character._speed * statsMultiplier);
      
      if (boss) {
        character.boss = true;
        isBoss = true;
      }
      team.push(character);
    }
    
    return { team, isBoss };
  }

  private async handleWin(i: Message, player: Player, arc: Arc, subArc: SubArc, act: Act) {
    player.arcManager.append({
      arcId: arc.id,
      subArcId: subArc.id,
      actId: act.id,
      result: "win"
    });

    const berries = this.calculateBerryReward(act.enemies);
    const [itemDrops, xp] = await this.processRewards(i, player, act);
    
    await this.showWinAnimation(i, act, itemDrops, berries, xp);
    await this.progressToNextAct(i, player, arc, subArc);
  }

  private async processRewards(i: Message, player: Player, act: Act) {
    player.deposit("berrys", this.calculateBerryReward(act.enemies));
    const itemDrops: Item[] = [];
    
    for (const { itemId, chance, secondDropChance } of act.enemies.flatMap(e => e.drops || [])) {
      const hasItem = player.items.some(item => item.itemId === itemId);
      const effectiveChance = hasItem && secondDropChance ? secondDropChance : chance;
      
      if (random.bool(effectiveChance)) {
        const item = await Item.get(itemId);
        const data = await ItemHandle.assignID(itemId, i.author.id);
        await ItemHandle.assignUser(data.uid, i.author.id);
        
        itemDrops.push(item);
        player.addItem(item);
      }
    }
    
    const xp = random.integer(1500, 2500);
    return [itemDrops, xp];
  }

  private calculateBerryReward(enemies: Enemy[]) {
    const enemyTypes = enemies.map(e => {
      if (e.boss) return 'boss';
      const name = e.charId.toLowerCase();
      return (name.startsWith("bandit") || name.startsWith("marine") || name.startsWith("pirate")) 
        ? 'npc' : 'mini';
    });
    
    const highestThreat = enemyTypes.includes('boss') ? 'boss' : 
                         enemyTypes.includes('mini') ? 'mini' : 'npc';
    
    return {
      npc: random.integer(2000, 3000),
      mini: random.integer(3000, 7000),
      boss: random.integer(7000, 10000)
    }[highestThreat];
  }
}