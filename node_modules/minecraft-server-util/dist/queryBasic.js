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
exports.queryBasic = void 0;
const assert_1 = __importDefault(require("assert"));
const minecraft_motd_util_1 = require("minecraft-motd-util");
const UDPClient_1 = __importDefault(require("./structure/UDPClient"));
const srvRecord_1 = require("./util/srvRecord");
function queryBasic(host, port = 25565, options) {
    var _a;
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
        (0, assert_1.default)(typeof options.sessionID === 'number' || typeof options.sessionID === 'undefined', `Expected 'options.sessionID' to be a 'number' or 'undefined', got '${typeof options.sessionID}'`);
        (0, assert_1.default)(typeof options.timeout === 'number' || typeof options.timeout === 'undefined', `Expected 'options.timeout' to be a 'number' or 'undefined', got '${typeof options.timeout}'`);
        if (typeof options.timeout === 'number') {
            (0, assert_1.default)(Number.isInteger(options.timeout), `Expected 'options.timeout' to be an integer, got '${options.timeout}'`);
            (0, assert_1.default)(options.timeout >= 0, `Expected 'options.timeout' to be greater than or equal to 0, got '${options.timeout}'`);
        }
    }
    const sessionID = ((_a = options === null || options === void 0 ? void 0 : options.sessionID) !== null && _a !== void 0 ? _a : 1) & 0x0F0F0F0F;
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var _b;
        const socket = new UDPClient_1.default(host, port);
        const timeout = setTimeout(() => {
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(new Error('Server is offline or unreachable'));
        }, (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : 1000 * 5);
        try {
            let srvRecord = null;
            if (typeof options === 'undefined' || typeof options.enableSRV === 'undefined' || options.enableSRV) {
                srvRecord = yield (0, srvRecord_1.resolveSRV)(host, 'udp');
                if (srvRecord) {
                    host = srvRecord.host;
                    port = srvRecord.port;
                }
            }
            // Request packet
            // https://wiki.vg/Query#Request
            {
                socket.writeUInt16BE(0xFEFD);
                socket.writeByte(0x09);
                socket.writeInt32BE(sessionID);
                yield socket.flush(false);
            }
            let challengeToken;
            // Response packet
            // https://wiki.vg/Query#Response
            {
                const packetType = yield socket.readByte();
                if (packetType !== 0x09)
                    throw new Error('Expected server to send packet type 0x09, received ' + packetType);
                const serverSessionID = yield socket.readInt32BE();
                if (sessionID !== serverSessionID)
                    throw new Error('Server session ID mismatch, expected ' + sessionID + ', received ' + serverSessionID);
                challengeToken = parseInt(yield socket.readStringNT());
                if (isNaN(challengeToken))
                    throw new Error('Server sent an invalid challenge token');
            }
            // Basic stat request packet
            // https://wiki.vg/Query#Request_2
            {
                socket.writeUInt16BE(0xFEFD);
                socket.writeByte(0x00);
                socket.writeInt32BE(sessionID);
                socket.writeInt32BE(challengeToken);
                yield socket.flush(false);
            }
            // Basic stat response packet
            // https://wiki.vg/Query#Response_2
            {
                const packetType = yield socket.readByte();
                if (packetType !== 0x00)
                    throw new Error('Expected server to send packet type 0x00, received ' + packetType);
                const serverSessionID = yield socket.readInt32BE();
                if (sessionID !== serverSessionID)
                    throw new Error('Server session ID mismatch, expected ' + sessionID + ', received ' + serverSessionID);
                const motdString = yield socket.readStringNT();
                const gameType = yield socket.readStringNT();
                const map = yield socket.readStringNT();
                const onlinePlayers = yield socket.readStringNT();
                const maxPlayers = yield socket.readStringNT();
                const hostPort = yield socket.readInt16LE();
                const hostIP = yield socket.readStringNT();
                const motd = (0, minecraft_motd_util_1.parse)(motdString);
                socket.close();
                clearTimeout(timeout);
                resolve({
                    motd: {
                        raw: (0, minecraft_motd_util_1.format)(motd),
                        clean: (0, minecraft_motd_util_1.clean)(motd),
                        html: (0, minecraft_motd_util_1.toHTML)(motd)
                    },
                    gameType,
                    map,
                    players: {
                        online: parseInt(onlinePlayers),
                        max: parseInt(maxPlayers)
                    },
                    hostPort,
                    hostIP
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
exports.queryBasic = queryBasic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlCYXNpYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9xdWVyeUJhc2ljLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG9EQUE0QjtBQUM1Qiw2REFBbUU7QUFDbkUsc0VBQThDO0FBRTlDLGdEQUE4QztBQWtCOUMsU0FBZ0IsVUFBVSxDQUFDLElBQVksRUFBRSxJQUFJLEdBQUcsS0FBSyxFQUFFLE9BQXNCOztJQUM1RSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRW5CLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsd0RBQXdELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQy9GLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSwwQ0FBMEMsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNsRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSwwREFBMEQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNyRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSwyREFBMkQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMxRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRSw2REFBNkQsT0FBTyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBRXRKLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1FBQ2hDLElBQUEsZ0JB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