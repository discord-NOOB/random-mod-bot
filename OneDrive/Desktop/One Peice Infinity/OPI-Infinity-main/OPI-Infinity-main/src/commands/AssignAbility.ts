import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { extractOption } from "../utils";
import { Character } from "../structure/Character";
import { Ability } from "../structure/Ability";

const opts = {
  abilityId: "ability_id",
  characterId: "character_id",
};

// List of allowed user IDs
const ALLOWED_USER_IDS = [
  "428259221017198592", "207787751368687616", "881113828195205131",
  "231838951265140738", "951105329528180786", "927606661789675581",
  "989893952813555732", "784786568489467905", "882029389842382898",
  "993570902820257812"
];

export default class extends Command {
  name = "assignability";
  description = "assigns ability to a character";

  constructor() {
    super();
    this.addStringOption(opt =>
      opt
        .setName(opts.abilityId)
        .setDescription("id of the ability")
        .setRequired(true)
    ).addStringOption(opt =>
      opt
        .setName(opts.characterId)
        .setDescription("id of the character")
        .setRequired(true)
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    // Check if the user is in the allowed list
    if (!ALLOWED_USER_IDS.includes(i.user.id)) {
      throw new CommandError("You do not have permission to use this command.");
    }

    const abilityId = extractOption<string>(i, opts.abilityId, true);
    const characterId = extractOption<string>(i, opts.characterId, true);

    const [character, ability] = await Promise.all([
      Character.get(characterId),
      Ability.get(abilityId),
    ]);

    if (character.abilities.includes(abilityId)) {
      throw new CommandError(`${character.name} already has this ability`);
    }

    character.abilities.push(ability.id);
    await character.save();

    await i.editReply(
      `Successfully assigned **${ability.name}** to **${character.name}**!`
    );
  }
}