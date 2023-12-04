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
exports.RCON = void 0;
const assert_1 = __importDefault(require("assert"));
const events_1 = require("events");
const util_1 = require("util");
const TCPClient_1 = __importDefault(require("./TCPClient"));
const encoder = new util_1.TextEncoder();
class RCON extends events_1.EventEmitter {
    constructor() {
        super();
        this.isLoggedIn = false;
        this.socket = null;
        this.requestID = 0;
    }
    get isConnected() {
        return this.socket && this.socket.isConnected || false;
    }
    connect(host, port = 25575, options = {}) {
        (0, assert_1.default)(typeof host === 'string', `Expected 'host' to be a 'string', got '${typeof host}'`);
        (0, assert_1.default)(host.length > 1, `Expected 'host' to have a length greater than 0, got ${host.length}`);
        (0, assert_1.default)(typeof port === 'number', `Expected 'port' to be a 'number', got '${typeof port}'`);
        (0, assert_1.default)(Number.isInteger(port), `Expected 'port' to be an integer, got '${port}'`);
        (0, assert_1.default)(port >= 0, `Expected 'port' to be greater than or equal to 0, got '${port}'`);
        (0, assert_1.default)(port <= 65535, `Expected 'port' to be less than or equal to 65535, got '${port}'`);
        (0, assert_1.default)(typeof options === 'object', `Expected 'options' to be an 'object', got '${typeof options}'`);
        return new Promise((resolve, reject) => {
            var _a;
            this.socket = new TCPClient_1.default();
            const timeout = setTimeout(() => {
                var _a;
                reject(new Error('Server is offline or unreachable'));
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
            }, (_a = options === null || options === void 0 ? void 0 : options.timeout) !== null && _a !== void 0 ? _a : 1000 * 5);
            this.socket.connect(Object.assign({ host, port }, options))
                .then(() => {
                clearTimeout(timeout);
                resolve();
            })
                .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    login(password, options = {}) {
        (0, assert_1.default)(typeof password === 'string', `Expected 'password' to be a 'string', got '${typeof password}'`);
        (0, assert_1.default)(password.length > 1, `Expected 'password' to have a length greater than 0, got ${password.length}`);
        (0, assert_1.default)(typeof options === 'object', `Expected 'options' to be an 'object', got '${typeof options}'`);
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.socket === null || !this.socket.isConnected)
                return reject(new Error('login() attempted before RCON has connected'));
            const timeout = setTimeout(() => {
                var _a;
                reject(new Error('Server is offline or unreachable'));
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
            }, (_a = options === null || options === void 0 ? void 0 : options.timeout) !== null && _a !== void 0 ? _a : 1000 * 5);
            this.isLoggedIn = false;
            const passwordBytes = encoder.encode(password);
            // Login packet
            // https://wiki.vg/RCON#3:_Login
            {
                this.socket.writeInt32LE(10 + passwordBytes.byteLength);
                this.socket.writeInt32LE(this.requestID++);
                this.socket.writeInt32LE(3);
                this.socket.writeBytes(passwordBytes);
                this.socket.writeBytes(Uint8Array.from([0x00, 0x00]));
                yield this.socket.flush(false);
            }
            // Login response packet
            // https://wiki.vg/RCON#3:_Login
            {
                const packetLength = yield this.socket.readInt32LE();
                this.socket.ensureBufferedData(packetLength);
                const requestID = yield this.socket.readInt32LE();
                if (requestID === -1)
                    reject(new Error('Invalid RCON password'));
                const packetType = yield this.socket.readInt32LE();
                if (packetType !== 2)
                    reject(new Error('Expected server to send packet type 2, received ' + packetType));
                yield this.socket.readBytes(2);
            }
            this.isLoggedIn = true;
            clearTimeout(timeout);
            resolve();
            process.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                while (this.socket !== null && this.socket.isConnected && this.isLoggedIn) {
                    try {
                        yield this._readPacket();
                    }
                    catch (e) {
                        this.emit('error', e);
                    }
                }
            }));
        }));
    }
    run(command) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, assert_1.default)(typeof command === 'string', `Expected 'command' to be a 'string', got '${typeof command}'`);
            (0, assert_1.default)(command.length > 0, `Expected 'command' to have a length greater than 0, got ${command.length}`);
            if (this.socket === null || !this.socket.isConnected)
                throw new Error('run() attempted before RCON has connected');
            if (!this.isLoggedIn)
                throw new Error('run() attempted before RCON has successfully logged in');
            const commandBytes = encoder.encode(command);
            const requestID = this.requestID++;
            this.socket.writeInt32LE(10 + commandBytes.byteLength);
            this.socket.writeInt32LE(requestID);
            this.socket.writeInt32LE(2);
            this.socket.writeBytes(commandBytes);
            this.socket.writeBytes(Uint8Array.from([0x00, 0x00]));
            yield this.socket.flush(false);
            return requestID;
        });
    }
    execute(command) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, assert_1.default)(typeof command === 'string', `Expected 'command' to be a 'string', got '${typeof command}'`);
            (0, assert_1.default)(command.length > 1, `Expected 'command' to have a length greater than 0, got ${command.length}`);
            const requestID = yield this.run(command);
            return new Promise((resolve) => {
                const listenerFunc = (data) => {
                    if (data.requestID !== requestID)
                        return;
                    this.removeListener('message', listenerFunc);
                    resolve(data.message);
                };
                this.on('message', listenerFunc);
            });
        });
    }
    _readPacket() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.socket === null || !this.socket.isConnected || !this.isLoggedIn)
                return Promise.reject(new Error('Attempted to read packet when socket was disconnected or RCON was not logged in'));
            const packetLength = yield this.socket.readInt32LE();
            yield this.socket.ensureBufferedData(packetLength);
            const requestID = yield this.socket.readInt32LE();
            const packetType = yield this.socket.readInt32LE();
            if (packetType === 0) {
                const message = yield this.socket.readStringNT();
                yield this.socket.readBytes(1);
                this.emit('message', { requestID, message });
            }
            else {
                yield this.socket.readBytes(packetLength - 8);
            }
        });
    }
    close() {
        var _a;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
    }
}
exports.RCON = RCON;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUkNPTi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdHJ1Y3R1cmUvUkNPTi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBNEI7QUFDNUIsbUNBQXNDO0FBRXRDLCtCQUFtQztBQUNuQyw0REFBb0M7QUFFcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQkFBVyxFQUFFLENBQUM7QUFpQmxDLE1BQU0sSUFBSyxTQUFRLHFCQUFZO0lBSzlCO1FBQ0MsS0FBSyxFQUFFLENBQUM7UUFMRixlQUFVLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLFdBQU0sR0FBcUIsSUFBSSxDQUFDO1FBQ2hDLGNBQVMsR0FBRyxDQUFDLENBQUM7SUFJdEIsQ0FBQztJQUVELElBQUksV0FBVztRQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUM7SUFDeEQsQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUFZLEVBQUUsSUFBSSxHQUFHLEtBQUssRUFBRSxVQUFtQyxFQUFFO1FBQ3hFLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztRQUMzRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsd0RBQXdELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQy9GLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztRQUMzRixJQUFBLGdCQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSwwQ0FBMEMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNsRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSwwREFBMEQsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNyRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSwyREFBMkQsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUMxRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLDhDQUE4QyxPQUFPLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFFckcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTs7WUFDdEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLG1CQUFTLEVBQUUsQ0FBQztZQUU5QixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFOztnQkFDL0IsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQztnQkFFdEQsTUFBQSxJQUFJLENBQUMsTUFBTSwwQ0FBRSxLQUFLLEVBQUUsQ0FBQztZQUN0QixDQUFDLEVBQUUsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsT0FBTyxtQ0FBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLGlCQUFHLElBQUksRUFBRSxJQUFJLElBQUssT0FBTyxFQUFHO2lCQUM3QyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNWLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFdEIsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDLENBQUM7aUJBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ2hCLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxLQUFLLENBQUMsUUFBZ0IsRUFBRSxVQUE0QixFQUFFO1FBQ3JELElBQUEsZ0JBQU0sRUFBQyxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsOENBQThDLE9BQU8sUUFBUSxHQUFHLENBQUMsQ0FBQztRQUN2RyxJQUFBLGdCQUFNLEVBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsNERBQTRELFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzNHLElBQUEsZ0JBQU0sRUFBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUUsOENBQThDLE9BQU8sT0FBTyxHQUFHLENBQUMsQ0FBQztRQUVyRyxPQUFPLElBQUksT0FBTyxDQUFDLENBQU8sT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFOztZQUM1QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXO2dCQUFFLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUMsQ0FBQztZQUU5SCxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFOztnQkFDL0IsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQztnQkFFdEQsTUFBQSxJQUFJLENBQUMsTUFBTSwwQ0FBRSxLQUFLLEVBQUUsQ0FBQztZQUN0QixDQUFDLEVBQUUsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsT0FBTyxtQ0FBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFakMsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFFeEIsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUUvQyxlQUFlO1lBQ2YsZ0NBQWdDO1lBQ2hDO2dCQUNDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsR0FBRyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQy9CO1lBRUQsd0JBQXdCO1lBQ3hCLGdDQUFnQztZQUNoQztnQkFDQyxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRTdDLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEQsSUFBSSxTQUFTLEtBQUssQ0FBQyxDQUFDO29CQUFFLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7Z0JBRWpFLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxVQUFVLEtBQUssQ0FBQztvQkFBRSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsa0RBQWtELEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFFekcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMvQjtZQUVELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBRXZCLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV0QixPQUFPLEVBQUUsQ0FBQztZQUVWLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBUyxFQUFFO2dCQUMzQixPQUFPLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7b0JBQzFFLElBQUk7d0JBQ0gsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7cUJBQ3pCO29CQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0QjtpQkFDRDtZQUNGLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFDSixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVLLEdBQUcsQ0FBQyxPQUFlOztZQUN4QixJQUFBLGdCQUFNLEVBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLDZDQUE2QyxPQUFPLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFDcEcsSUFBQSxnQkFBTSxFQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLDJEQUEyRCxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUV4RyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUNuSCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVU7Z0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1lBRWhHLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBRW5DLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUvQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO0tBQUE7SUFFSyxPQUFPLENBQUMsT0FBZTs7WUFDNUIsSUFBQSxnQkFBTSxFQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSw2Q0FBNkMsT0FBTyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ3BHLElBQUEsZ0JBQU0sRUFBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSwyREFBMkQsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFFeEcsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTFDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDOUIsTUFBTSxZQUFZLEdBQUcsQ0FBQyxJQUFhLEVBQUUsRUFBRTtvQkFDdEMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVM7d0JBQUUsT0FBTztvQkFFekMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBRTdDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUMsQ0FBQztnQkFFRixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FBQTtJQUVLLFdBQVc7O1lBQ2hCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVO2dCQUFFLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpRkFBaUYsQ0FBQyxDQUFDLENBQUM7WUFFOUwsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3JELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVuRCxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRW5ELElBQUksVUFBVSxLQUFLLENBQUMsRUFBRTtnQkFDckIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUVqRCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUUvQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO2FBQzdDO2lCQUFNO2dCQUNOLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzlDO1FBQ0YsQ0FBQztLQUFBO0lBRUQsS0FBSzs7UUFDSixNQUFBLElBQUksQ0FBQyxNQUFNLDBDQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3RCLENBQUM7Q0FDRDtBQUVRLG9CQUFJIn0=