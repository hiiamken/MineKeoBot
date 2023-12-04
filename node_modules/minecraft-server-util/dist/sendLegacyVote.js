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
exports.sendLegacyVote = void 0;
const assert_1 = __importDefault(require("assert"));
const crypto_1 = __importDefault(require("crypto"));
const TCPClient_1 = __importDefault(require("./structure/TCPClient"));
const wordwrap = (str, size) => str.replace(new RegExp(`(?![^\\n]{1,${size}}$)([^\\n]{1,${size}})\\s`, 'g'), '$1\n');
function sendLegacyVote(host, port = 8192, options) {
    host = host.trim();
    options.key = options.key.replace(/ /g, '+');
    options.key = wordwrap(options.key, 65);
    (0, assert_1.default)(typeof host === 'string', `Expected 'host' to be a 'string', got '${typeof host}'`);
    (0, assert_1.default)(host.length > 1, `Expected 'host' to have a length greater than 0, got ${host.length}`);
    (0, assert_1.default)(typeof port === 'number', `Expected 'port' to be a 'number', got '${typeof port}'`);
    (0, assert_1.default)(Number.isInteger(port), `Expected 'port' to be an integer, got '${port}'`);
    (0, assert_1.default)(port >= 0, `Expected 'port' to be greater than or equal to 0, got '${port}'`);
    (0, assert_1.default)(port <= 65535, `Expected 'port' to be less than or equal to 65535, got '${port}'`);
    (0, assert_1.default)(typeof options === 'object', `Expected 'options' to be an 'object', got '${typeof options}'`);
    (0, assert_1.default)(typeof options.username === 'string', `Expected 'options.username' to be an 'string', got '${typeof options.username}'`);
    (0, assert_1.default)(options.username.length > 1, `Expected 'options.username' to have a length greater than 0, got ${options.username.length}`);
    (0, assert_1.default)(typeof options.key === 'string', `Expected 'options.key' to be an 'string', got '${typeof options.key}'`);
    (0, assert_1.default)(options.key.length > 1, `Expected 'options.key' to have a length greater than 0, got ${options.key.length}`);
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        let socket = undefined;
        const timeout = setTimeout(() => {
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(new Error('Server is offline or unreachable'));
        }, (_a = options === null || options === void 0 ? void 0 : options.timeout) !== null && _a !== void 0 ? _a : 1000 * 5);
        try {
            socket = new TCPClient_1.default();
            yield socket.connect({ host, port, timeout: (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : 1000 * 5 });
            // Handshake packet
            // https://github.com/NuVotifier/NuVotifier/wiki/Technical-QA#handshake
            {
                const version = yield socket.readStringUntil(0x0A);
                const split = version.split(' ');
                if (split[0] !== 'VOTIFIER')
                    throw new Error('Not connected to a Votifier server. Expected VOTIFIER in handshake, received: ' + version);
            }
            // Send vote packet
            // https://github.com/NuVotifier/NuVotifier/wiki/Technical-QA#protocol-v1
            {
                const timestamp = (_c = options.timestamp) !== null && _c !== void 0 ? _c : Date.now();
                const address = (_d = options.address) !== null && _d !== void 0 ? _d : host + ':' + port;
                const publicKey = `-----BEGIN PUBLIC KEY-----\n${options.key}\n-----END PUBLIC KEY-----\n`;
                const vote = `VOTE\n${options.serviceName}\n${options.username}\n${address}\n${timestamp}\n`;
                const encryptedPayload = crypto_1.default.publicEncrypt({
                    key: publicKey,
                    padding: crypto_1.default.constants.RSA_PKCS1_PADDING,
                }, Buffer.from(vote));
                socket.writeBytes(encryptedPayload);
                yield socket.flush(false);
            }
            // Close connection and resolve
            {
                clearTimeout(timeout);
                socket.close();
                resolve();
            }
        }
        catch (e) {
            clearTimeout(timeout);
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(e);
        }
    }));
}
exports.sendLegacyVote = sendLegacyVote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZExlZ2FjeVZvdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2VuZExlZ2FjeVZvdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLG9EQUE0QjtBQUM1QixzRUFBOEM7QUFHOUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFXLEVBQUUsSUFBWSxFQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUNsRSxJQUFJLE1BQU0sQ0FBQyxlQUFlLElBQUksZ0JBQWdCLElBQUksT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FDdkUsQ0FBQztBQUVGLFNBQWdCLGNBQWMsQ0FBQyxJQUFZLEVBQUUsSUFBSSxHQUFHLElBQUksRUFBRSxPQUE4QjtJQUN2RixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRW5CLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzdDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFeEMsSUFBQSxnQkFBTSxFQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSwwQ0FBMEMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQzNGLElBQUEsZ0JBQU0sRUFBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSx3REFBd0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDL0YsSUFBQSxnQkFBTSxFQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSwwQ0FBMEMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQzNGLElBQUEsZ0JBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLDBDQUEwQyxJQUFJLEdBQUcsQ0FB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