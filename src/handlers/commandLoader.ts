import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Collection } from 'discord.js';

/**
 * Hàm quét và load tất cả command trong một thư mục (prefix hoặc slash).
 * @param commandsPath Đường dẫn tới thư mục chứa file lệnh
 * @returns Collection<string, any> - (key là command.name hoặc command.data.name)
 */
async function loadCommandsFromDir(commandsPath: string): Promise<Collection<string, any>> {
  const commands = new Collection<string, any>();

  // Kiểm tra thư mục
  if (!fs.existsSync(commandsPath)) {
    console.warn(`⚠ Thư mục không tồn tại: ${commandsPath}`);
    return commands;
  }

  // Lọc file .js hoặc .ts
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href;

    try {
      const commandModule = await import(fileUrl);

      // Tìm đối tượng lệnh (named export) có thuộc tính "name" hoặc "data.name"
      let foundCommand = null;
      for (const key of Object.keys(commandModule)) {
        const candidate = commandModule[key];
        if (candidate && (candidate.name || candidate.data?.name)) {
          foundCommand = candidate;
          break;
        }
      }

      // Kiểm tra
      const commandName = foundCommand?.name || foundCommand?.data?.name;
      if (!foundCommand || !commandName) {
        console.warn(`⚠ File "${file}" không có thuộc tính "name" (command không hợp lệ).`);
        continue;
      }

      // Lưu vào Collection
      foundCommand.fileName = file;
      commands.set(commandName, foundCommand);
    } catch (error) {
      console.error(`❌ Lỗi khi import lệnh từ "${file}":`, error);
    }
  }

  return commands;
}

/** Load lệnh prefix thường */
export async function loadPrefixCommands(): Promise<Collection<string, any>> {
  const commandsPath = path.join(__dirname, '../commands/prefix');
  return loadCommandsFromDir(commandsPath);
}

/** Load lệnh slash thường */
export async function loadSlashCommands(): Promise<Collection<string, any>> {
  const commandsPath = path.join(__dirname, '../commands/slash');
  return loadCommandsFromDir(commandsPath);
}
