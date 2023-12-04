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
exports.statusBedrock = void 0;
const assert_1 = __importDefault(require("assert"));
const minecraft_motd_util_1 = require("minecraft-motd-util");
const UDPClient_1 = __importDefault(require("./structure/UDPClient"));
const srvRecord_1 = require("./util/srvRecord");
function statusBedrock(host, port = 19132, options) {
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
        var _a;
        const socket = new UDPClient_1.default(host, port);
        const timeout = setTimeout(() => {
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(new Error('Server is offline or unreachable'));
        }, (_a = options === null || options === void 0 ? void 0 : options.timeout) !== null && _a !== void 0 ? _a : 1000 * 5);
        try {
            let srvRecord = null;
            if (typeof options === 'undefined' || typeof options.enableSRV === 'undefined' || options.enableSRV) {
                srvRecord = yield (0, srvRecord_1.resolveSRV)(host, 'udp');
                if (srvRecord) {
                    host = srvRecord.host;
                    port = srvRecord.port;
                }
            }
            // Unconnected ping packet
            // https://wiki.vg/Raknet_Protocol#Unconnected_Ping
            {
                socket.writeByte(0x01);
                socket.writeInt64BE(BigInt(Date.now()));
                socket.writeBytes(Uint8Array.from([0x00, 0xFF, 0xFF, 0x00, 0xFE, 0xFE, 0xFE, 0xFE, 0xFD, 0xFD, 0xFD, 0xFD, 0x12, 0x34, 0x56, 0x78]));
                socket.writeInt64BE(BigInt(2));
                yield socket.flush(false);
            }
            // Unconnected pong packet
            // https://wiki.vg/Raknet_Protocol#Unconnected_Pong
            {
                const packetType = yield socket.readByte();
                if (packetType !== 0x1C)
                    throw new Error('Expected server to send packet type 0x1C, received ' + packetType);
                yield socket.readInt64BE();
                const serverGUID = yield socket.readInt64BE();
                yield socket.readBytes(16);
                const responseLength = yield socket.readInt16BE();
                const response = yield socket.readString(responseLength);
                const [edition, motdLine1, protocolVersion, version, onlinePlayers, maxPlayers, serverID, motdLine2, gameMode, gameModeID, portIPv4, portIPv6] = response.split(';');
                const motd = (0, minecraft_motd_util_1.parse)(motdLine1 + (motdLine2 ? '\n' + motdLine2 : ''));
                socket.close();
                clearTimeout(timeout);
                resolve({
                    edition,
                    motd: {
                        raw: (0, minecraft_motd_util_1.format)(motd),
                        clean: (0, minecraft_motd_util_1.clean)(motd),
                        html: (0, minecraft_motd_util_1.toHTML)(motd)
                    },
                    version: {
                        name: version,
                        protocol: parseInt(protocolVersion)
                    },
                    players: {
                        online: parseInt(onlinePlayers),
                        max: parseInt(maxPlayers)
                    },
                    serverGUID,
                    serverID,
                    gameMode,
                    gameModeID: parseInt(gameModeID),
                    portIPv4: portIPv4 ? parseInt(portIPv4) : null,
                    portIPv6: portIPv6 ? parseInt(portIPv6) : null,
                    srvRecord
                });
            }
        }
        catch (e) {
            clearTimeout(timeout);
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(e);
        }
    }));
}
exports.statusBedrock = statusBedrock;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzQmVkcm9jay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zdGF0dXNCZWRyb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG9EQUE0QjtBQUM1Qiw2REFBbUU7QUFDbkUsc0VBQThDO0FBRzlDLGdEQUE4QztBQUU5QyxTQUFnQixhQUFhLENBQUMsSUFBWSxFQUFFLElBQUksR0FBRyxLQUFLLEVBQUUsT0FBOEI7SUFDdkYsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUVuQixJQUFBLGdCQUFNLEVBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLDBDQUEwQyxPQUFPLElBQUksR0FBRyxDQUFDLENBQUM7SUFDM0YsSUFBQSxnQkFBTSxFQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHdEQUF3RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUMvRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLDBDQUEwQyxPQUFPLElBQUksR0FBRyxDQUFDLENBQUM7SUFDM0YsSUFBQSxnQkFBTSxFQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsMENBQTBDLElBQUksR0FBRyxDQUFDLENBQUM7SUFDbEYsSUFBQSxnQkFBTSxFQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsMERBQTBELElBQUksR0FBRyxDQUFDLENBQUM7SUFDckYsSUFBQSxnQkFBTSxFQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsMkRBQTJELElBQUksR0FBRyxDQUFDLENBQUM7SUFDMUYsSUFBQSxnQkFBTSxFQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUUsNkRBQTZELE9BQU8sT0FBTyxHQUFHLENBQUMsQ0FBQztJQUV0SixJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtRQUNoQyxJQUFB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