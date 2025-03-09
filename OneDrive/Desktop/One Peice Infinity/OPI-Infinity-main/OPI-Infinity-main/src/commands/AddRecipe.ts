import { Command, CommandError } from "@jiman24/slash-commandment";
import {
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { extractOption } from "../utils";
import { Animal } from "../structure/Animal";

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
  name: "name",
  description: "description",
  imageUrl: "image_url",
  animal1: "first_meat",
  animal2: "second_meat",
  animal3: "third_meat",
  value: "value",
  emoji: "emoji_if_any",
  color: "embed_color",
};

const animals = Animal.meats;
const choices = animals.map((a) => ({ name: a.name, value: a.name.toLowerCase() }));
const meatArray = animals.map((a) => a.name);

export default class extends Command {
  name = "addrecipe";
  description = "Add a new recipe.";

  constructor() {
    super();
    this.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    this.addStringOption((opt) =>
      opt.setName(opts.name).setDescription("Dish name").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName("id").setDescription("Dish's ID").setRequired(true)
    );
    this.addIntegerOption((opt) =>
      opt.setName(opts.value).setDescription("Dish value in berries").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName(opts.description).setDescription("Dish description").setRequired(true)
    );
    ["animal1", "animal2", "animal3"].forEach((meat) => {
      this.addStringOption((opt) =>
        opt.setName(opts[meat]).setDescription(`${meat.replace("animal", "Meat")}`).addChoices(...choices).setRequired(true)
      );
    });
    this.addStringOption((opt) =>
      opt.setName(opts.imageUrl).setDescription("GIF or image URL")
    );
    this.addStringOption((opt) =>
      opt.setName(opts.emoji).setDescription("Emoji for dish")
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    // Check if the user is allowed to use this command
    if (!ADMIN_IDS.includes(i.user.id)) {
      throw new CommandError("You do not have permission to use this command.");
    }

    const name = extractOption<string>(i, opts.name);
    const id = extractOption<string>(i, "id").replace(/ /g, "_");
    const description = extractOption<string>(i, opts.description);
    const imageUrl = extractOption<string>(i, opts.imageUrl) ?? "";
    const emoji = extractOption<string>(i, opts.emoji) ?? "";
    const color = extractOption<string>(i, opts.color) ?? "";
    const value = extractOption<number>(i, opts.value);

    const toMix = ["animal1", "animal2", "animal3"]
      .map((meat) => extractOption<string>(i, opts[meat]))
      .filter(Boolean); // Remove null values

    const indices = toMix.map((meat) => meatArray.findIndex((a) => a.toLowerCase() === meat.toLowerCase())).sort();

    const recipe = {
      formula: indices,
      dish: { name, description, value, id },
      attributes: { emoji, gif: imageUrl, color },
    };

    const rec = await Animal.saveRecipe(recipe);

    if (!rec.added) {
      throw new CommandError(rec.reason);
    }

    const embed = new EmbedBuilder()
      .setTitle("New Recipe Added ✅")
      .setDescription(
        `**Name:** \`${recipe.dish.name} ${recipe.attributes.emoji}\`⠀**•**⠀**Value:** \`${recipe.dish.value}\`\n` +
        `**Description:** *${recipe.dish.description}*\n\n` +
        `**ID:** \`${recipe.dish.id}\`⠀**•**⠀**Total Recipes:** \`${rec.count + 1}\``
      )
      .setFooter({ text: `Created by ${i.user.tag}` })
      .setColor(recipe.attributes.color || "#e4f52c");

    if (recipe.attributes.gif) embed.setImage(recipe.attributes.gif);

    const meatList = indices.map((m, index) =>
      `\`[${index + 1}]\` ${Animal.getEmoji(meatArray[m], true)} **${meatArray[m]}**`
    ).join("\n");

    embed.addFields([{ name: "Meats", value: meatList || "No meats found." }]);

    await i.editReply({ embeds: [embed] });
  }
}
