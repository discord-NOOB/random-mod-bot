import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, PermissionFlagsBits } from "discord.js";
import { extractOption, isAdminAaryan } from "../utils";
import { Rarity } from "../structure/Character";
import { Character } from "../structure/Character";

const ADMIN_IDS = [
  "428259221017198592",
  "207787751368687616",
  "881113828195205131",
  "231838951265140738",
  "951105329528180786",
  "927606661789675581",
  "989893952813555732",
  "784786568489467905",
  "882029389842382898",
  "993570902820257812",
];

const opts = {
  id: "id",
  name: "name",
  description: "description",
  imageUrl: "image_url",
  rarity: "rarity",
  health: "health",
  attack: "attack",
  defense: "defense",
  speed: "speed",
  stamina: "stamina",
};

const rarities = [
  "common",
  "uncommon",
  "rare",
  "custom",
  "epic",
  "legendary",
  "mythical",
  "godly",
];

export default class extends Command {
  name = "addchar";
  description = "Adds a new character to the game.";

  constructor() {
    super();
    this.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    this.addStringOption((opt) =>
      opt.setName(opts.id).setDescription("Character ID").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName(opts.name).setDescription("Character name").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName(opts.description).setDescription("Character description").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName(opts.imageUrl).setDescription("Character image URL").setRequired(true)
    );

    this.addStringOption((opt) =>
      opt
        .setName(opts.rarity)
        .setDescription("Character rarity")
        .setRequired(true)
        .addChoices(...rarities.map((r) => ({ name: r, value: r })))
    );

    // Adding numeric options dynamically
    ["health", "attack", "defense", "speed", "stamina"].forEach((stat) => {
      this.addIntegerOption((opt) =>
        opt.setName(opts[stat]).setDescription(`Character ${stat}`).setMinValue(0)
      );
    });
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    // Check if the user is in the allowed list
    if (!ADMIN_IDS.includes(i.user.id)) {
      throw new CommandError("You do not have permission to use this command.");
    }

    await isAdminAaryan(i);

    const id = extractOption<string>(i, opts.id, true);
    const name = extractOption<string>(i, opts.name, true);
    const description = extractOption<string>(i, opts.description, true);
    const imageUrl = extractOption<string>(i, opts.imageUrl, true);
    const rarity = extractOption<Rarity>(i, opts.rarity, true);

    // Extract stats, defaulting to 0 if not provided
    const stats = ["health", "attack", "defense", "speed", "stamina"].reduce(
      (acc, stat) => {
        acc[stat] = extractOption<number>(i, opts[stat]) || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    if (await Character.has(id)) {
      throw new CommandError("Character already exists.");
    }

    const character = new Character({
      id,
      name,
      description,
      imageUrl,
      rarity,
      ...stats,
    });

    await character.save();
    await i.editReply(`✅ Successfully added **${name}** to the database.`);
  }
}
