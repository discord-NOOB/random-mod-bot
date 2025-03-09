import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, PermissionFlagsBits } from "discord.js";
import { extractOption } from "../utils";
import { Ability, AbilityType } from "../structure/Ability";

const ADMIN_IDS = [
  "428259221017198592", "207787751368687616", "881113828195205131", 
  "231838951265140738", "951105329528180786", "927606661789675581", 
  "989893952813555732", "784786568489467905", "882029389842382898", 
  "993570902820257812"
];

const opts = {
  id: "id",
  name: "name",
  description: "description",
  type: "type",
  heal: "heal",
  damage: "damage",
  imageUrl: "image_url",
  stamina: "stamina",
  staminaCharge: "stamina_charge",
};

export default class extends Command {
  name = "addability";
  description = "Create ability";

  constructor() {
    super();
    this.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    this.addStringOption((opt) =>
      opt.setName(opts.id).setDescription("ID for the ability").setRequired(true)
    );

    this.addStringOption((opt) =>
      opt.setName(opts.name).setDescription("Name for the ability").setRequired(true)
    );

    this.addStringOption((opt) =>
      opt.setName(opts.description).setDescription("Ability description").setRequired(true)
    );

    this.addStringOption((opt) =>
      opt.setName(opts.type).setDescription("Type of the ability").setRequired(true).addChoices(
        { name: "Attack", value: "special-attack" },
        { name: "Heal", value: "heal" },
        { name: "Stamina", value: "stamina-charge" }
      )
    );

    this.addStringOption((opt) =>
      opt.setName(opts.imageUrl).setDescription("Animation when using this ability").setRequired(true)
    );

    this.addNumberOption((opt) =>
      opt.setName(opts.stamina).setDescription("Amount of stamina this ability uses").setMinValue(1).setRequired(true)
    );

    this.addNumberOption((opt) =>
      opt.setName(opts.damage).setDescription("Amount of damage (only for attack abilities)").setMinValue(0).setRequired(false)
    );

    this.addNumberOption((opt) =>
      opt.setName(opts.heal).setDescription("Amount of healing (only for heal abilities)").setMinValue(0).setRequired(false)
    );

    this.addNumberOption((opt) =>
      opt.setName(opts.staminaCharge).setDescription("Stamina charge amount (only for stamina abilities)").setMinValue(0).setRequired(false)
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    if (!ADMIN_IDS.includes(i.user.id)) {
      throw new CommandError("❌ You do not have permission to use this command.");
    }

    const id = extractOption<string>(i, opts.id, true);
    const name = extractOption<string>(i, opts.name, true);
    const description = extractOption<string>(i, opts.description, true);
    const type = extractOption<AbilityType>(i, opts.type, true);
    const imageUrl = extractOption<string>(i, opts.imageUrl, true);
    const staminaCost = extractOption<number>(i, opts.stamina, true);
    const damage = extractOption<number>(i, opts.damage, false) || 0;
    const heal = extractOption<number>(i, opts.heal, false) || 0;
    const staminaCharge = extractOption<number>(i, opts.staminaCharge, false) || 0;

    if (await Ability.has(id)) {
      throw new CommandError(`❌ Ability with ID "${id}" already exists.`);
    }

    const ability = new Ability({
      id,
      name,
      description,
      type,
      damage,
      heal,
      imageUrl,
      staminaCost,
      staminaCharge,
    });

    await ability.save();
    await i.editReply(`✅ Successfully saved **${ability.name}** to the database!`);
  }
}
