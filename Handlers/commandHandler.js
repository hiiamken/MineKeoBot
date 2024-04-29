const path = require('path');

function loadCommands(client) {
    const ascii = require('ascii-table');
    const fs = require('fs');
    const table = new ascii().setHeading("Lệnh", "Trạng thái");

    let commandsArray = [];

    const commandsFolder = fs.readdirSync('./Commands');
    for (const folder of commandsFolder) {
        const folderPath = `./Commands/${folder}`;
        const stat = fs.lstatSync(folderPath);
        if (!stat.isDirectory()) {
            continue;
        }
        const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

        for (const file of commandFiles) {
            const commandFile = require(path.join('..', folderPath, file));

            const properties = {folder, ...commandFile};
            client.commands.set(commandFile.data.name, properties);

            commandsArray.push(commandFile.data.toJSON());

            table.addRow(file, "Sẵn sàng");
        }
    }

    client.application.commands.set(commandsArray);

    return console.log(table.toString(), `\n Lệnh đã load`);
}

module.exports = { loadCommands };