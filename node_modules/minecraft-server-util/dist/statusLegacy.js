"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusLegacy = void 0;
const assert_1 = __importDefault(require("assert"));
const minecraft_motd_util_1 = require("minecraft-motd-util");
const util_1 = require("util");
const TCPClient_1 = __importDefault(require("./structure/TCPClient"));
const srvRecord_1 = require("./util/srvRecord");
// Credit for this method is owed to fabianwennink <3
// https://github.com/fabianwennink/minecraft-server-util/blob/master/src/statusFE01All.ts
const decoder = new util_1.TextDecoder('utf-16be');
function statusLegacy(host, port = 25565, options) {
    host = host.trim();
    (0, assert_1.default)(typeof host === 'string', `Expected 'host' to be a 'string', got '${typeof host}'`);
    (0, assert_1.default)(host.length > 1, `Expected 'host' to have a length greater than 0, got ${host.length}`);
    (0, assert_1.default)(typeof port === 'number', `Expected 'port' to be a 'number', got '${typeof port}'`);
    (0, assert_1.default)(Number.isInteger(port), `Expected 'port' to be an integer, got '${port}'`);
    (0, assert_1.default)(port >= 0, `Expected 'port' to be greater than or equal to 0, got '${port}'`);
    (0, assert_1.default)(port <= 65535, `Expected 'port' to be less than or equal to 65535, got '${port}'`);
    (0, assert_1.default)(typeof options === 'object' || typeof options === 'undefined', `Expected 'options' to be an 'object' or 'undefined', got '${typeof options}'`);
    if (typeof options === 'object') {
        (0, assert_1.default)(typeof options.enableSRV === 'boolean' || typeof options.enableSRV === 'undefined', `Expected 'options.enableSRV' to be a 'boolean' or 'undefined', got '${typeof options.enableSRV}'`);
        (0, assert_1.default)(typeof options.timeout === 'number' || typeof options.timeout === 'undefined', `Expected 'options.timeout' to be a 'number' or 'undefined', got '${typeof options.timeout}'`);
        if (typeof options.timeout === 'number') {
            (0, assert_1.default)(Number.isInteger(options.timeout), `Expected 'options.timeout' to be an integer, got '${options.timeout}'`);
            (0, assert_1.default)(options.timeout >= 0, `Expected 'options.timeout' to be greater than or equal to 0, got '${options.timeout}'`);
        }
    }
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const socket = new TCPClient_1.default();
        const timeout = setTimeout(() => {
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(new Error('Server is offline or unreachable'));
        }, (_a = options === null || options === void 0 ? void 0 : options.timeout) !== null && _a !== void 0 ? _a : 1000 * 5);
        try {
            let srvRecord = null;
            if (typeof options === 'undefined' || typeof options.enableSRV === 'undefined' || options.enableSRV) {
                srvRecord = yield (0, srvRecord_1.resolveSRV)(host);
                if (srvRecord) {
                    host = srvRecord.host;
                    port = srvRecord.port;
                }
            }
            yield socket.connect({ host, port, timeout: (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : 1000 * 5 });
            // Client to server packet
            // https://wiki.vg/Server_List_Ping#Client_to_server
            {
                socket.writeBytes(Uint8Array.from([0xFE, 0x01]));
                yield socket.flush(false);
            }
            let protocolVersion;
            let versionName;
            let rawMOTD;
            let onlinePlayers;
            let maxPlayers;
            // Server to client packet
            // https://wiki.vg/Server_List_Ping#Server_to_client
            {
                const packetType = yield socket.readByte();
                if (packetType !== 0xFF)
                    throw new Error('Packet returned from server was unexpected type');
                const length = yield socket.readUInt16BE();
                const data = decoder.decode(yield socket.readBytes(length * 2));
                if (data[0] === '\u00A7' || data[1] === '1') {
                    // 1.4+ server
                    const split = data.split('\0');
                    protocolVersion = parseInt(split[1]);
                    versionName = split[2];
                    rawMOTD = split[3];
                    onlinePlayers = parseInt(split[4]);
                    maxPlayers = parseInt(split[5]);
                }
                else {
                    // < 1.4 server
                    const split = data.split('\u00A7');
                    protocolVersion = null;
                    versionName = null;
                    rawMOTD = split[0];
                    onlinePlayers = parseInt(split[1]);
                    maxPlayers = parseInt(split[2]);
                }
            }
            socket.close();
            clearTimeout(timeout);
            const motd = (0, minecraft_motd_util_1.parse)(rawMOTD);
            resolve({
                version: versionName === null && protocolVersion === null ? null : {
                    name: versionName,
                    protocol: protocolVersion
                },
                players: {
                    online: onlinePlayers,
                    max: maxPlayers
                },
                motd: {
                    raw: (0, minecraft_motd_util_1.format)(motd),
                    clean: (0, minecraft_motd_util_1.clean)(motd),
                    html: (0, minecraft_motd_util_1.toHTML)(motd)
                },
                srvRecord
            });
        }
        catch (e) {
            clearTimeout(timeout);
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(e);
        }
    }));
}
exports.statusLegacy = statusLegacy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzTGVnYWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0YXR1c0xlZ2FjeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBNEI7QUFDNUIsNkRBQW1FO0FBQ25FLCtCQUFtQztBQUNuQyxzRUFBOEM7QUFHOUMsZ0RBQThDO0FBRTlDLHFEQUFxRDtBQUNyRCwwRkFBMEY7QUFFMUYsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRTVDLFNBQWdCLFlBQVksQ0FBQyxJQUFZLEVBQUUsSUFBSSxHQUFHLEtBQUssRUFBRSxPQUEyQjtJQUNuRixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRW5CLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsd0RBQXdELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQy9GLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSwwQ0FBMEMsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNsRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSwwREFBMEQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNyRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSwyREFBMkQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMxRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sT0FBTyxLQUFL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