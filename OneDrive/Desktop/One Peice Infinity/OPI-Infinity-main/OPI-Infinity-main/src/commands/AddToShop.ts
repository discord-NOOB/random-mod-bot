import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { extractOption, isAdmin } from "../utils";
import { Shop, isShopItemType } from "../structure/Shop";
import { Item } from "../structure/Item";
import { Character } from "../structure/Character";

const opts = {
  shopId: "shop_id",
  itemId: "item_id",
  itemType: "item_type",
  price: "price",
};

export default class extends Command {
  name = "addtoshop";
  description = "put item in the shop";

  constructor() {
    super();

    this.addStringOption((opt) =>
      opt.setName(opts.shopId)
        .setDescription("id of the shop")
        .setRequired(true)
    );

    this.addStringOption((opt) =>
      opt.setName(opts.itemId)
        .setDescription("id of the item")
        .setRequired(true)
    );

    this.addStringOption((opt) =>
      opt.setName(opts.itemType)
        .setDescription("type of item")
        .setRequired(true)
        .addChoices(
          { name: "character", value: "character" },
          { name: "item", value: "item" }
        )
    );

    this.addIntegerOption((opt) =>
      opt.setName(opts.price)
        .setDescription("price to put in the shop")
        .setMinValue(0)
        .setRequired(true)
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    if (!(await isAdmin(i))) {
      return i.editReply({ content: "You do not have permission to use this command." });
    }

    const shopId = extractOption<string>(i, opts.shopId);
    const itemId = extractOption<string>(i, opts.itemId);
    const itemType = extractOption<string>(i, opts.itemType);
    const price = extractOption<number>(i, opts.price);

    if (!isShopItemType(itemType)) {
      throw new CommandError(`"${itemType}" is not a valid item type.`);
    }

    const shop = await Shop.get(shopId);
    const item = itemType === "item" ? await Item.get(itemId) : await Character.get(itemId);

    shop.add(item.id, itemType, price);
    await shop.save();

    await i.editReply(`✅ Added **${item.name}** to **${shop.name}** for **${price}**!`);
  }
}
