import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { story } from "../client"; // Ensure story instance is loaded here
import { extractOption } from "../utils";

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

export default class extends Command {
  name = "addrequiredcrew";
  description = "Add required crew members for a specific arc.";

  constructor() {
    super();
    this.addStringOption((opt) =>
      opt.setName("saga").setDescription("Saga ID").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName("chapter").setDescription("Chapter ID").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt.setName("arc").setDescription("Arc ID").setRequired(true)
    );
    this.addStringOption((opt) =>
      opt
        .setName("requiredcrew")
        .setDescription("Required crew members (as a string)")
        .setRequired(true)
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    // Restrict access to the specified admin users
    if (!ADMIN_IDS.includes(i.user.id)) {
      throw new CommandError("You do not have permission to use this command.");
    }

    try {
      const sagaId = parseInt(extractOption<string>(i, "saga"));
      const chapterId = parseInt(extractOption<string>(i, "chapter"));
      const arcId = parseInt(extractOption<string>(i, "arc"));
      const requiredCrew = extractOption<string>(i, "requiredcrew");

      const arc = story.getCurrentArc(sagaId, chapterId, arcId);
      arc.required_crew = requiredCrew;

      story.saveToFile();

      await i.editReply({
        content: `✅ **Successfully updated required crew!**\n` +
          `**Saga ID:** \`${sagaId}\`\n` +
          `**Chapter ID:** \`${chapterId}\`\n` +
          `**Arc ID:** \`${arcId}\`\n` +
          `**Required Crew:** \`${requiredCrew}\``,
      });
    } catch (error) {
      await i.editReply(`❌ **Failed to add required crew:** ${error}`);
    }
  }
}
