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
exports.statusFE01FA = void 0;
const assert_1 = __importDefault(require("assert"));
const minecraft_motd_util_1 = require("minecraft-motd-util");
const util_1 = require("util");
const TCPClient_1 = __importDefault(require("./structure/TCPClient"));
const srvRecord_1 = require("./util/srvRecord");
const encoder = new util_1.TextEncoder();
/**
 * @deprecated
 */
function statusFE01FA(host, port = 25565, options) {
    process.emitWarning('Use of statusFE01FA() has been deprecated since 5.2.0 in favor of a statusLegacy(). This method will be removed during the next major release of the minecraft-server-util library.', 'DeprecationWarning');
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
                const hostBytes = encoder.encode(host);
                socket.writeBytes(Uint8Array.from([0xFE, 0x01, 0xFA]));
                socket.writeInt16BE(11);
                socket.writeStringBytes('MC|PingHost');
                socket.writeInt16BE(7 + hostBytes.byteLength);
                socket.writeByte(0x4A);
                socket.writeInt16BE(hostBytes.length);
                socket.writeBytes(hostBytes);
                socket.writeInt16BE(port);
                yield socket.flush(false);
            }
            // Server to client packet
            // https://wiki.vg/Server_List_Ping#Server_to_client
            {
                const kickIdentifier = yield socket.readByte();
                if (kickIdentifier !== 0xFF)
                    throw new Error('Expected server to send 0xFF kick packet, got ' + kickIdentifier);
                const remainingLength = yield socket.readInt16BE();
                const remainingData = yield socket.readBytes(remainingLength * 2);
                const [protocolVersionString, version, motdString, onlinePlayersString, maxPlayersString] = remainingData.slice(6).swap16().toString('utf16le').split('\0');
                const motd = (0, minecraft_motd_util_1.parse)(motdString);
                socket.close();
                clearTimeout(timeout);
                resolve({
                    protocolVersion: parseInt(protocolVersionString),
                    version,
                    players: {
                        online: parseInt(onlinePlayersString),
                        max: parseInt(maxPlayersString)
                    },
                    motd: {
                        raw: (0, minecraft_motd_util_1.format)(motd),
                        clean: (0, minecraft_motd_util_1.clean)(motd),
                        html: (0, minecraft_motd_util_1.toHTML)(motd)
                    },
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
exports.statusFE01FA = statusFE01FA;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzRkUwMUZBLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0YXR1c0ZFMDFGQS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBNEI7QUFDNUIsNkRBQW1FO0FBQ25FLCtCQUFtQztBQUNuQyxzRUFBOEM7QUFHOUMsZ0RBQThDO0FBRTlDLE1BQU0sT0FBTyxHQUFHLElBQUksa0JBQVcsRUFBRSxDQUFDO0FBRWxDOztHQUVHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLElBQVksRUFBRSxJQUFJLEdBQUcsS0FBSyxFQUFFLE9BQTJCO0lBQ25GLE9BQU8sQ0FBQyxXQUFXLENBQUMscUxBQXFMLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUVqTyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRW5CLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsd0RBQXdELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQy9GLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSwwQ0FBMEMsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNsRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSwwREFBMEQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNyRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSwyREFBMkQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMxRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxPQUFP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