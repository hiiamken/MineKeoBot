const {
    SlashCommandBuilder,
    TextInputBuilder,
    ModalBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionsBitField,
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("capnhat")
      .setDescription("Gửi thông báo với thông tin cụ thể.")
      .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
      .setDMPermission(false)
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("Loại thông báo")
          .setRequired(true)
          .addChoices(
            { name: "Sugus", value: "sugus" },
            { name: "KitKat", value: "kitkat" },
            { name: "Cherry", value: "cherry" },
            { name: "Twizzlers", value: "twizzlers" },
            { name: "Banana", value: "banana" },
            { name: "Berry", value: "berry" }
          )
      ),
  
    async execute(interaction) {
      const type = interaction.options.getString("type");
      let roleID;
      switch (type) {
        case "sugus":
          roleID = "1121769192622923876";
          break;
        case "kitkat":
          roleID = "1121768840792129611";
          break;
        case "cherry":
          roleID = "1128168073724166144";
          break;
        case "twizzlers":
          roleID = "1205182157258227723";
          break;
        case "banana":
          roleID = "1230876436232015872";
          break;
        case "berry":
          roleID = "1251810702859960350";
          break;
        default:
          await interaction.reply({
            content: "Loại thông báo không hợp lệ.",
            ephemeral: true,
          });
          return;
      }
  
      let prefixEmoji = "";
      switch (type) {
        case "sugus":
          prefixEmoji = "<:purple_candy:1108910210355048498>";
          break;
        case "kitkat":
          prefixEmoji = "<:orange_candy:1108910233809604639>";
          break;
        case "cherry":
          prefixEmoji = "<:red_cherry:1128167407215726682>";
          break;
        case "twizzlers":
          prefixEmoji = "<:candydungeon:1205182078119841902>";
          break;
        case "banana":
          prefixEmoji = "<:OHHHHH_BANANA:1230876399233929246>";
          break;
        case "berry":
          prefixEmoji = "<:blue_candy:1251810196351881258>";
          break;
        default:
          prefixEmoji = "";
          break;
      }
  
      const memberRoleIds = interaction.member.roles.cache.map((role) => role.id);
      if (!memberRoleIds.includes("1180041593928032306")) {
        await interaction.reply({
          content: "Bạn không có quyền sử dụng lệnh này.",
          ephemeral: true,
        });
        return;
      }
  
      // Tạo modal
      const modal = new ModalBuilder()
        .setCustomId("sendNotificationModal")
        .setTitle("Gửi Thông Báo");
  
      const versionInput = new TextInputBuilder()
        .setCustomId("notificationVersion")
        .setLabel("Phiên bản")
        .setStyle(TextInputStyle.Short)
        .setRequired(false); // Không bắt buộc nhập
  
      const versionContentInput = new TextInputBuilder()
        .setCustomId("notificationVersionContent")
        .setLabel("Nội dung phiên bản")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false); // Không bắt buộc nhập
  
      const updateInput = new TextInputBuilder()
        .setCustomId("notificationUpdate")
        .setLabel("Cập nhật")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);
  
      const fixInput = new TextInputBuilder()
        .setCustomId("notificationFix")
        .setLabel("Sửa lỗi")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);
  
      const newInput = new TextInputBuilder()
        .setCustomId("notificationNew")
        .setLabel("Mới")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);
  
      modal.addComponents(
        new ActionRowBuilder().addComponents(versionInput),
        new ActionRowBuilder().addComponents(versionContentInput),
        new ActionRowBuilder().addComponents(updateInput),
        new ActionRowBuilder().addComponents(fixInput),
        new ActionRowBuilder().addComponents(newInput)
      );
  
      await interaction.showModal(modal);
  
      interaction
        .awaitModalSubmit({
          filter: (i) => i.customId === "sendNotificationModal",
          time: 300000,
        })
        .then(async (modalSubmitInteraction) => {
          await modalSubmitInteraction.deferReply({ ephemeral: true });
  
          const formatInput = (input) => {
            const unifiedInput = input.replace(/\n/g, ";");
            return unifiedInput
              .split(";")
              .map((item) => `- ${item.trim()}`)
              .join("\n");
          };
  
          const version = modalSubmitInteraction.fields.getTextInputValue(
            "notificationVersion"
          );
          const versionContent = modalSubmitInteraction.fields.getTextInputValue(
            "notificationVersionContent"
          );
          const updateValue =
            modalSubmitInteraction.fields.getTextInputValue("notificationUpdate");
          const fixValue =
            modalSubmitInteraction.fields.getTextInputValue("notificationFix");
          const newValue =
            modalSubmitInteraction.fields.getTextInputValue("notificationNew");
  
          let responseMessage = `${prefixEmoji} <@&${roleID}> \`Cập nhật phiên bản\``;
  
          if (version) {
            responseMessage += ` \`${version}\``;
            if (versionContent) {
              responseMessage += ` | \`${versionContent}\``;
            }
          }
          responseMessage += "\n\n";
  
          if (updateValue) {
            responseMessage += `**UPDATED!**\n${formatInput(updateValue)}\n`;
          }
          if (fixValue) {
            responseMessage += `**FIXED!**\n${formatInput(fixValue)}\n`;
          }
          if (newValue) {
            responseMessage += `**NEW!**\n${formatInput(newValue)}\n`;
          }
  
          responseMessage += "\n**MineKeo Network**";
  
          const channel = modalSubmitInteraction.client.channels.cache.get(
            "1257178630237458465"
          );
          if (channel) {
            const sentMessage = await channel.send(responseMessage);
            // Thêm reaction vào tin nhắn
            const emojis = [
              "❤️",
              "🎉",
              "👌",
              "🇻🇳",
              "🙉",
              "👀",
              "😭",
              "💔",
              "😴",
              "🐧",
              "🔥",
              "💯",
            ];
            for (const emoji of emojis) {
              await sentMessage.react(emoji);
            }
            await modalSubmitInteraction.editReply({
              content: "Thông báo đã được gửi!",
              ephemeral: true,
            });
          } else {
            await modalSubmitInteraction.editReply({
              content: "Không tìm thấy kênh để gửi thông báo.",
              ephemeral: true,
            });
          }
        })
        .catch(async (error) => {
          console.error(error);
          await interaction.followUp({
            content: "Đã xảy ra lỗi khi xử lý modal.",
            ephemeral: true,
          });
        });
    },
  };