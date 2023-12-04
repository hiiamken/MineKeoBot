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
exports.sendVote = void 0;
const assert_1 = __importDefault(require("assert"));
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const TCPClient_1 = __importDefault(require("./structure/TCPClient"));
const encoder = new util_1.TextEncoder();
function sendVote(host, port = 8192, options) {
    host = host.trim();
    (0, assert_1.default)(typeof host === 'string', `Expected 'host' to be a 'string', got '${typeof host}'`);
    (0, assert_1.default)(host.length > 1, `Expected 'host' to have a length greater than 0, got ${host.length}`);
    (0, assert_1.default)(typeof port === 'number', `Expected 'port' to be a 'number', got '${typeof port}'`);
    (0, assert_1.default)(Number.isInteger(port), `Expected 'port' to be an integer, got '${port}'`);
    (0, assert_1.default)(port >= 0, `Expected 'port' to be greater than or equal to 0, got '${port}'`);
    (0, assert_1.default)(port <= 65535, `Expected 'port' to be less than or equal to 65535, got '${port}'`);
    (0, assert_1.default)(typeof options === 'object', `Expected 'options' to be an 'object', got '${typeof options}'`);
    (0, assert_1.default)(typeof options.username === 'string', `Expected 'options.username' to be an 'string', got '${typeof options.username}'`);
    (0, assert_1.default)(options.username.length > 1, `Expected 'options.username' to have a length greater than 0, got ${options.username.length}`);
    (0, assert_1.default)(typeof options.token === 'string', `Expected 'options.token' to be an 'string', got '${typeof options.token}'`);
    (0, assert_1.default)(options.token.length > 1, `Expected 'options.token' to have a length greater than 0, got ${options.token.length}`);
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        let socket = undefined;
        const timeout = setTimeout(() => {
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(new Error('Server is offline or unreachable'));
        }, (_a = options === null || options === void 0 ? void 0 : options.timeout) !== null && _a !== void 0 ? _a : 1000 * 5);
        try {
            socket = new TCPClient_1.default();
            yield socket.connect({ host, port, timeout: (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : 1000 * 5 });
            let challengeToken;
            // Handshake packet
            // https://github.com/NuVotifier/NuVotifier/wiki/Technical-QA#handshake
            {
                const version = yield socket.readStringUntil(0x0A);
                const split = version.split(' ');
                if (split[0] !== 'VOTIFIER')
                    throw new Error('Not connected to a Votifier server. Expected VOTIFIER in handshake, received: ' + version);
                if (split[1] !== '2')
                    throw new Error('Unsupported Votifier version: ' + split[1]);
                challengeToken = split[2];
            }
            // Send vote packet
            // https://github.com/NuVotifier/NuVotifier/wiki/Technical-QA#protocol-v2
            {
                const payload = {
                    serviceName: (_c = options.serviceName) !== null && _c !== void 0 ? _c : 'minecraft-server-util (https://github.com/PassTheMayo/minecraft-server-util)',
                    username: options.username,
                    address: (_d = options.address) !== null && _d !== void 0 ? _d : host + ':' + port,
                    timestamp: (_e = options.timestamp) !== null && _e !== void 0 ? _e : Date.now(),
                    challenge: challengeToken
                };
                if (options.uuid) {
                    payload.uuid = options.uuid;
                }
                const payloadSerialized = JSON.stringify(payload);
                const message = {
                    payload: payloadSerialized,
                    signature: crypto_1.default.createHmac('sha256', options.token).update(payloadSerialized).digest('base64')
                };
                const messageSerialized = JSON.stringify(message);
                const messageBytes = encoder.encode(messageSerialized);
                socket.writeInt16BE(0x733A);
                socket.writeInt16BE(messageBytes.byteLength);
                socket.writeBytes(messageBytes);
                yield socket.flush(false);
            }
            // Response packet
            // https://github.com/NuVotifier/NuVotifier/wiki/Technical-QA#protocol-v2
            {
                const responseString = yield socket.readStringUntil(0x0A);
                const response = JSON.parse(responseString);
                socket.close();
                clearTimeout(timeout);
                switch (response.status) {
                    case 'ok': {
                        resolve();
                        break;
                    }
                    case 'error': {
                        reject(new Error(response.cause + ': ' + response.error));
                        break;
                    }
                    default: {
                        reject(new Error('Server sent an unknown response: ' + responseString));
                        break;
                    }
                }
            }
        }
        catch (e) {
            clearTimeout(timeout);
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(e);
        }
    }));
}
exports.sendVote = sendVote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZFZvdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2VuZFZvdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLG9EQUE0QjtBQUM1QiwrQkFBbUM7QUFDbkMsc0VBQThDO0FBRzlDLE1BQU0sT0FBTyxHQUFHLElBQUksa0JBQVcsRUFBRSxDQUFDO0FBRWxDLFNBQWdCLFFBQVEsQ0FBQyxJQUFZLEVBQUUsSUFBSSxHQUFHLElBQUksRUFBRSxPQUF3QjtJQUMzRSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRW5CLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsd0RBQXdELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQy9GLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSwwQ0FBMEMsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNsRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSwwREFBMEQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNyRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSwyREFBMkQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMxRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLDhDQUE4QyxPQUFPLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDckcsSUFBQSxnQkFBTSxFQUFDLE9BQU8sT0FBTyxDQUFDLFFB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