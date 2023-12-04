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
const dgram_1 = __importDefault(require("dgram"));
const events_1 = require("events");
const util_1 = require("util");
const varint_1 = require("../util/varint");
const encoder = new util_1.TextEncoder();
const decoder = new util_1.TextDecoder('utf-8');
class UDPClient extends events_1.EventEmitter {
    constructor(host, port) {
        super();
        this.data = Buffer.alloc(0);
        this.host = host;
        this.port = port;
        this.socket = dgram_1.default.createSocket('udp4');
        this.socket.on('message', (data) => {
            this.data = Buffer.concat([this.data, data]);
            this.emit('data');
        });
    }
    readByte() {
        return this.readUInt8();
    }
    writeByte(value) {
        this.writeUInt8(value);
    }
    readBytes(length) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(length);
            const value = this.data.slice(0, length);
            this.data = this.data.slice(length);
            return value;
        });
    }
    writeBytes(data) {
        this.data = Buffer.concat([this.data, data]);
    }
    readUInt8() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(1);
            const value = this.data.readUInt8(0);
            this.data = this.data.slice(1);
            return value;
        });
    }
    writeUInt8(value) {
        const data = Buffer.alloc(1);
        data.writeUInt8(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readInt8() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(1);
            const value = this.data.readInt8(0);
            this.data = this.data.slice(1);
            return value;
        });
    }
    writeInt8(value) {
        const data = Buffer.alloc(1);
        data.writeInt8(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readUInt16BE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(2);
            const value = this.data.readUInt16BE(0);
            this.data = this.data.slice(2);
            return value;
        });
    }
    writeUInt16BE(value) {
        const data = Buffer.alloc(2);
        data.writeUInt16BE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readInt16BE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(2);
            const value = this.data.readInt16BE(0);
            this.data = this.data.slice(2);
            return value;
        });
    }
    writeInt16BE(value) {
        const data = Buffer.alloc(2);
        data.writeInt16BE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readUInt16LE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(2);
            const value = this.data.readUInt16LE(0);
            this.data = this.data.slice(2);
            return value;
        });
    }
    writeUInt16LE(value) {
        const data = Buffer.alloc(2);
        data.writeUInt16LE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readInt16LE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(2);
            const value = this.data.readInt16LE(0);
            this.data = this.data.slice(2);
            return value;
        });
    }
    writeInt16LE(value) {
        const data = Buffer.alloc(2);
        data.writeInt16LE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readUInt32BE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(4);
            const value = this.data.readUInt32BE(0);
            this.data = this.data.slice(4);
            return value;
        });
    }
    writeUInt32BE(value) {
        const data = Buffer.alloc(4);
        data.writeUInt32BE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readInt32BE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(4);
            const value = this.data.readInt32BE(0);
            this.data = this.data.slice(4);
            return value;
        });
    }
    writeInt32BE(value) {
        const data = Buffer.alloc(4);
        data.writeInt32BE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readUInt32LE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(4);
            const value = this.data.readUInt32LE(0);
            this.data = this.data.slice(4);
            return value;
        });
    }
    writeUInt32LE(value) {
        const data = Buffer.alloc(4);
        data.writeUInt32LE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readInt32LE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(4);
            const value = this.data.readInt32LE(0);
            this.data = this.data.slice(4);
            return value;
        });
    }
    writeInt32LE(value) {
        const data = Buffer.alloc(4);
        data.writeInt32LE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readUInt64BE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(8);
            const value = this.data.readBigUInt64BE(0);
            this.data = this.data.slice(8);
            return value;
        });
    }
    writeUInt64BE(value) {
        const data = Buffer.alloc(8);
        data.writeBigUInt64BE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readInt64BE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(8);
            const value = this.data.readBigInt64BE(0);
            this.data = this.data.slice(8);
            return value;
        });
    }
    writeInt64BE(value) {
        const data = Buffer.alloc(8);
        data.writeBigInt64BE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readUInt64LE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(8);
            const value = this.data.readBigUInt64LE(0);
            this.data = this.data.slice(8);
            return value;
        });
    }
    writeUInt64LE(value) {
        const data = Buffer.alloc(8);
        data.writeBigUInt64LE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readInt64LE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(8);
            const value = this.data.readBigInt64LE(0);
            this.data = this.data.slice(8);
            return value;
        });
    }
    writeInt64LE(value) {
        const data = Buffer.alloc(8);
        data.writeBigInt64LE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readFloatBE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(4);
            const value = this.data.readFloatBE(0);
            this.data = this.data.slice(4);
            return value;
        });
    }
    writeFloatBE(value) {
        const data = Buffer.alloc(4);
        data.writeFloatBE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readFloatLE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(4);
            const value = this.data.readFloatLE(0);
            this.data = this.data.slice(4);
            return value;
        });
    }
    writeFloatLE(value) {
        const data = Buffer.alloc(4);
        data.writeFloatLE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readDoubleBE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(8);
            const value = this.data.readDoubleBE(0);
            this.data = this.data.slice(8);
            return value;
        });
    }
    writeDoubleBE(value) {
        const data = Buffer.alloc(8);
        data.writeDoubleBE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readDoubleLE() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureBufferedData(8);
            const value = this.data.readDoubleLE(0);
            this.data = this.data.slice(8);
            return value;
        });
    }
    writeDoubleLE(value) {
        const data = Buffer.alloc(8);
        data.writeDoubleLE(value);
        this.data = Buffer.concat([this.data, data]);
    }
    readVarInt() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, varint_1.readVarInt)(() => this.readByte());
        });
    }
    writeVarInt(value) {
        this.writeBytes((0, varint_1.writeVarInt)(value));
    }
    readString(length) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.readBytes(length);
            return decoder.decode(data);
        });
    }
    writeString(value) {
        this.writeBytes(encoder.encode(value));
    }
    readStringVarInt() {
        return __awaiter(this, void 0, void 0, function* () {
            const length = yield this.readVarInt();
            const data = yield this.readBytes(length);
            return Array.from(data).map((point) => String.fromCodePoint(point)).join('');
        });
    }
    writeStringVarInt(value) {
        const data = encoder.encode(value);
        this.writeVarInt(data.byteLength);
        this.writeBytes(data);
    }
    readStringNT() {
        return __awaiter(this, void 0, void 0, function* () {
            let buf = Buffer.alloc(0);
            let value;
            while ((value = yield this.readByte()) !== 0x00) {
                buf = Buffer.concat([buf, Buffer.from([value])]);
            }
            return Array.from(buf).map((point) => String.fromCodePoint(point)).join('');
        });
    }
    readStringNTFollowedBy(suffixes) {
        return __awaiter(this, void 0, void 0, function* () {
            let buf = Buffer.alloc(0);
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const value = yield this.readByte();
                if (value === 0x00 && (yield this.checkUpcomingData(suffixes))) {
                    break;
                }
                buf = Buffer.concat([buf, Buffer.from([value])]);
            }
            return Array.from(buf).map((point) => String.fromCodePoint(point)).join('');
        });
    }
    checkUpcomingData(suffixes) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = 0;
            while (suffixes.length) {
                yield this.ensureBufferedData(i + 1);
                const remaining = [];
                for (const suffix of suffixes) {
                    if (this.data[i] === suffix[i]) {
                        if (i === suffix.length - 1) {
                            return suffix;
                        }
                        remaining.push(suffix);
                    }
                }
                suffixes = remaining;
                i++;
            }
            return null;
        });
    }
    writeStringNT(value) {
        const data = encoder.encode(value);
        this.writeBytes(data);
        this.writeByte(0x00);
    }
    writeStringBytes(value) {
        this.writeBytes(encoder.encode(value));
    }
    flush(prefixLength = true) {
        if (!this.socket)
            return Promise.resolve();
        return new Promise((resolve, reject) => {
            let buf = this.data;
            if (prefixLength) {
                buf = Buffer.concat([(0, varint_1.writeVarInt)(buf.byteLength), buf]);
            }
            this.socket.send(buf, 0, buf.byteLength, this.port, this.host, (error) => {
                if (error)
                    return reject(error);
                resolve();
            });
            this.data = Buffer.alloc(0);
        });
    }
    close() {
        var _a;
        try {
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
        }
        catch (_b) {
            // Ignore
        }
    }
    ensureBufferedData(byteLength) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data.byteLength >= byteLength)
                return Promise.resolve();
            return this._waitForData(byteLength);
        });
    }
    _waitForData(byteLength = 1) {
        return new Promise((resolve, reject) => {
            const dataHandler = () => {
                if (this.data.byteLength >= byteLength) {
                    this.removeListener('data', dataHandler);
                    this.socket.removeListener('error', errorHandler);
                    resolve();
                }
            };
            const errorHandler = (error) => {
                this.removeListener('data', dataHandler);
                this.socket.removeListener('error', errorHandler);
                reject(error);
            };
            this.once('data', () => dataHandler());
            this.socket.on('error', (error) => errorHandler(error));
        });
    }
    hasRemainingData() {
        return this.data.byteLength > 0;
    }
}
exports.default = UDPClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVURQQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N0cnVjdHVyZS9VRFBDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrREFBc0M7QUFDdEMsbUNBQXNDO0FBQ3RDLCtCQUFnRDtBQUNoRCwyQ0FBeUQ7QUFFekQsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQkFBVyxFQUFFLENBQUM7QUFDbEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQkFBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRXpDLE1BQU0sU0FBVSxTQUFRLHFCQUFZO0lBTW5DLFlBQVksSUFBWSxFQUFFLElBQVk7UUFDckMsS0FBSyxFQUFFLENBQUM7UUFIRCxTQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUs5QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLGVBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFekMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbEMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRTdDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsUUFBUTtRQUNQLE9BQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxTQUFTLENBQUMsS0FBYTtRQUN0QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFSyxT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