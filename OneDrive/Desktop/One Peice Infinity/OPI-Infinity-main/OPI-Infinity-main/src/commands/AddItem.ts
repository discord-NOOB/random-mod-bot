import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, PermissionFlagsBits } from "discord.js";
import { extractOption, isAdminAaryan } from "../utils";
import { Rarity } from "../structure/Character";
import { Category, Item } from "../structure/Item";

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
  category: "category",
  damage: "damage",
  defense: "defense",
  health: "health",
  speed: "speed",
  staminaGain: "stamina_gain",
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

const categories = ["equippable", "consumable"];

export default class extends Command {
  name = "additem";
  description = "Adds an item to the game.";

  constructor() {
    super();
    this.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    this.addStringOption((opt) =>
      opt.setName(opts.id).setDescription("Item ID").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName(opts.name).setDescription("Item name").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName(opts.description).setDescription("Item description").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName(opts.imageUrl).setDescription("Item image URL").setRequired(true)
    );

    this.addStringOption((opt) =>
      opt
        .setName(opts.rarity)
        .setDescription("Item rarity")
        .setRequired(true)
        .addChoices(...rarities.map((r) => ({ name: r, value: r })))
    );

    this.addStringOption((opt) =>
      opt
        .setName(opts.category)
        .setDescription("Item category")
        .setRequired(true)
        .addChoices(...categories.map((c) => ({ name: c, value: c })))
    );

    // Adding numeric options dynamically
    ["damage", "defense", "health", "speed", "staminaGain"].forEach((stat) => {
      this.addIntegerOption((opt) =>
        opt.setName(opts[stat]).setDescription(`Item ${stat}`).setMinValue(0)
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
    const category = extractOption<Category>(i, opts.category, true);

    // Extract stats, defaulting to 0 if not provided
    const stats = ["damage", "defense", "health", "speed", "staminaGain"].reduce(
      (acc, stat) => {
        acc[stat] = extractOption<number>(i, opts[stat]) || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    if (await Item.has(id)) {
      throw new CommandError("Item already exists.");
    }

    const item = new Item({
      id,
      name,
      description,
      imageUrl,
      rarity,
      category,
      ...stats,
    });

    await item.save();
    await i.editReply(`✅ Successfully added **${name}** to the database.`);
  }
}
