const { Client, GatewayIntentBits, Events, ButtonStyle, ActionRowBuilder } = require("discord.js");
const Giveaway = require("../../Models/Giveaway");
const { ButtonBuilder } = require("@discordjs/builders");
 
module.exports = async (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isButton()) {
            const customId = interaction.customId;
 
            if (customId.startsWith("giveaway-join")) {
                const giveawayId = customId.split("-").slice(2).join("-"); 
 
                const giveaway = await Giveaway.findOne({id: giveawayId});
 
                if (!giveaway) {
                    await interaction.reply({ content: "This giveaway no longer exists.", ephemeral: true });
                }
 
                if (giveaway.participants.includes(interaction.user.id)) {
 
                    const buttonRed = new ButtonBuilder().setCustomId(`leave-giveaway-${giveawayId}`).setLabel("Leave Giveaway").setStyle(ButtonStyle.Danger)
                    const row = new ActionRowBuilder().addComponents(buttonRed)
                    await interaction.reply({ content: "You have already joined this giveaway.", ephemeral: true, components: [row] });
 
                    
                } else {
                    giveaway.participants.push(interaction.user.id);
                    await giveaway.save();
    
                    interaction.reply({ content: "You have successfully joined the giveaway!", ephemeral: true });
                }
            } else if (customId.startsWith("leave-giveaway")) {
                const giveawayId = customId.split("-").slice(2).join("-");
                const giveaway = await Giveaway.findOne({id: giveawayId});
            
                giveaway.participants = giveaway.participants.filter(participantId => participantId !== interaction.user.id);
                await giveaway.save();
            
                await interaction.reply({
                    content: "You have left the giveaway!",
                    ephemeral: true
                });
            }
        }
    });
}
 
