import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Collection } from 'discord.js';

/**
 * Hàm quét và load tất cả admin command trong một thư mục (admin prefix hoặc admin slash) theo cách đệ quy.
 * @param commandsPath Đường dẫn tới thư mục chứa file lệnh admin.
 * @returns Collection<string, any> - (key là command.name hoặc command.data.name)
 */
async function loadAdminCommandsFromDir(commandsPath: string): Promise<Collection<string, any>> {
  const commands = new Collection<string, any>();

  if (!fs.existsSync(commandsPath)) {
    console.warn(`⚠ Thư mục không tồn tại: ${commandsPath}`);
    return commands;
  }

  // Đọc tất cả các entry (file hoặc thư mục) trong thư mục hiện tại
  const entries = fs.readdirSync(commandsPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(commandsPath, entry.name);

    if (entry.isDirectory()) {
      // Nếu là thư mục, gọi đệ quy để load các file bên trong
      const subCommands = await loadAdminCommandsFromDir(fullPath);
      subCommands.forEach((cmd, key) => {
        commands.set(key, cmd);
      });
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
      const fileUrl = pathToFileURL(fullPath).href;

      try {
        const commandModule = await import(fileUrl);

        // Tìm đối tượng lệnh có thuộc tính "name" hoặc "data.name"
        let foundCommand = null;
        for (const key of Object.keys(commandModule)) {
          const candidate = commandModule[key];
          if (candidate && (candidate.name || candidate.data?.name)) {
            foundCommand = candidate;
            break;
          }
        }

        const commandName = foundCommand?.name || foundCommand?.data?.name;
        if (!foundCommand || !commandName) {
          console.warn(`⚠ File "${entry.name}" không có thuộc tính "name" (admin command không hợp lệ).`);
          continue;
        }

        foundCommand.fileName = entry.name;
        commands.set(commandName, foundCommand);
      } catch (error) {
        console.error(`❌ [Admin] Lỗi khi import lệnh từ "${entry.name}":`, error);
      }
    }
  }

  return commands;
}

/** Load lệnh admin prefix */
export async function loadAdminPrefixCommands(): Promise<Collection<string, any>> {
  const commandsPath = path.join(__dirname, '../admincommands/prefix');
  return loadAdminCommandsFromDir(commandsPath);
}

/** Load lệnh admin slash */
export async function loadAdminSlashCommands(): Promise<Collection<string, any>> {
  const commandsPath = path.join(__dirname, '../admincommands/slash');
  return loadAdminCommandsFromDir(commandsPath);
}
