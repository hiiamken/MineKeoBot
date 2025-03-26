import { REST, Routes } from 'discord.js';
import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Tự động quét và load tất cả các lệnh slash từ thư mục được chỉ định (đệ quy).
 * @param dir Đường dẫn đến thư mục chứa các file lệnh slash.
 * @returns Mảng các lệnh dưới dạng JSON (đã gọi .toJSON())
 */
async function loadSlashCommandsFromDir(dir: string): Promise<any[]> {
  const commands: any[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Nếu là thư mục, gọi đệ quy để load các file bên trong
      const subCommands = await loadSlashCommandsFromDir(fullPath);
      commands.push(...subCommands);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      const fileUrl = pathToFileURL(fullPath).href;
      const commandModule = await import(fileUrl);
      
      // Kiểm tra export
      let command = commandModule.default || commandModule;
      if (command.data && command.data.name) {
        commands.push(command.data.toJSON());
      } else {
        // Nếu không có default export, duyệt qua từng key
        for (const key in commandModule) {
          const cmd = commandModule[key];
          if (cmd && cmd.data && cmd.data.name) {
            commands.push(cmd.data.toJSON());
          }
        }
      }
    }
  }
  
  return commands;
}


async function main() {
  // Thay đổi đường dẫn này theo cấu trúc dự án của bạn
  const normalCommandsDir = path.join(__dirname, 'commands/slash');
  const adminCommandsDir = path.join(__dirname, 'admincommands/slash');

  // Quét và load tất cả lệnh slash
  const normalCommands = await loadSlashCommandsFromDir(normalCommandsDir);
  const adminCommands = await loadSlashCommandsFromDir(adminCommandsDir);
  const allCommands = [...normalCommands, ...adminCommands];

  // Tạo REST instance
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  // Đăng ký lệnh dưới dạng Guild Commands cho server cụ thể
  const guildId = '1096684955045728328'; // Thay ID server của bạn ở đây
  try {
    console.log(`\n🚀 Đang đăng ký tất cả lệnh mới trên server ${guildId}...`);
    const registeredCommands: any = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
      { body: allCommands }
    );

    console.log('✅ Đăng ký thành công! Các lệnh đã đăng ký:');
    if (Array.isArray(registeredCommands)) {
      console.table(
        registeredCommands.map((cmd: any) => ({
          Name: cmd.name,
          ID: cmd.id,
          Description: cmd.description,
        }))
      );
    } else {
      console.log(registeredCommands);
    }
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký lệnh Guild:', error);
  }
}

main();
