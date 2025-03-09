import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { extractOption, isAdminUser } from "../utils";
import { Skin } from "../structure/Skin";

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
  "993570902820257812"
];

enum Options {
  id = "id",
  name = "name",
  character = "character",
  image = "image",
}

export default class extends Command {
  name = "addskin";
  description = "Add a new skin to the database";

  constructor() {
    super();
    this.addStringOption(opt => opt.setName(Options.id).setDescription("ID for the skin").setRequired(true));
    this.addStringOption(opt => opt.setName(Options.name).setDescription("Name for the skin").setRequired(true));
    this.addStringOption(opt => opt.setName(Options.character).setDescription("Character for the skin").setRequired(true));
    this.addStringOption(opt => opt.setName(Options.image).setDescription("Image for the skin").setRequired(true));
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    if (!ADMIN_IDS.includes(i.user.id)) {
      return i.editReply({ content: "❌ You do not have permission to use this command." });
    }

    const id = extractOption<string>(i, Options.id, true);
    const name = extractOption<string>(i, Options.name, true);
    const character = extractOption<string>(i, Options.character, true);
    const image = extractOption<string>(i, Options.image, true);

    if (await Skin.has(id)) {
      return i.editReply({ content: "⚠️ A skin with this ID already exists." });
    }

    const skin = new Skin({ id, name, character, image });
    await skin.save();

    const data = await skin.show(i);
    await i.editReply({ content: "✅ Successfully added skin to the database!", ...data });
  }
}
