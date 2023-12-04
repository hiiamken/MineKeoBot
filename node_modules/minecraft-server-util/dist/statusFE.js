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
exports.statusFE = void 0;
const assert_1 = __importDefault(require("assert"));
const TCPClient_1 = __importDefault(require("./structure/TCPClient"));
const srvRecord_1 = require("./util/srvRecord");
/**
 * @deprecated
 */
function statusFE(host, port = 25565, options) {
    process.emitWarning('Use of statusFE() has been deprecated since 5.2.0 in favor of a statusLegacy(). This method will be removed during the next major release of the minecraft-server-util library.', 'DeprecationWarning');
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
            // Ping packet
            // https://wiki.vg/Server_List_Ping#Beta_1.8_to_1.3
            {
                socket.writeByte(0xFE);
                yield socket.flush(false);
            }
            // Response packet
            // https://wiki.vg/Server_List_Ping#Beta_1.8_to_1.3
            {
                const packetID = yield socket.readByte();
                if (packetID !== 0xFF)
                    throw new Error('Expected server to send 0xFF kick packet, got ' + packetID);
                const packetLength = yield socket.readInt16BE();
                const remainingData = yield socket.readBytes(packetLength * 2);
                const [motd, onlinePlayersString, maxPlayersString] = remainingData.swap16().toString('utf16le').split('\u00A7');
                socket.close();
                clearTimeout(timeout);
                resolve({
                    players: {
                        online: parseInt(onlinePlayersString),
                        max: parseInt(maxPlayersString)
                    },
                    motd,
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
exports.statusFE = statusFE;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzRkUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc3RhdHVzRkUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLHNFQUE4QztBQUc5QyxnREFBOEM7QUFFOUM7O0dBRUc7QUFDSCxTQUFnQixRQUFRLENBQUMsSUFBWSxFQUFFLElBQUksR0FBRyxLQUFLLEVBQUUsT0FBMkI7SUFDL0UsT0FBTyxDQUFDLFdBQVcsQ0FBQyxpTEFBaUwsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBRTdOLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFbkIsSUFBQSxnQkFBTSxFQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSwwQ0FBMEMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQzNGLElBQUEsZ0JBQU0sRUFBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSx3REFBd0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDL0YsSUFBQSxnQkFBTSxFQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSwwQ0FBMEMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQzNGLElBQUEsZ0JBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLDBDQUEwQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2xGLElBQUEsZ0JBQU0sRUFBQyxJQUFJLElBQUksQ0FBQyxFQUFFLDBEQUEwRCxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ3JGLElBQUEsZ0JBQU0sRUFBQyxJQUFJLElBQUksS0FBSyxFQUFFLDJEQUEyRCxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQzFGLElBQUEsZ0JBQU0sRUFBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxFQUFFLDZEQUE2RCxPQUFPLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFF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