/**
* Created by nakakura on 3/21/14.
*/
/// <reference path="./messagepack.d.ts"/>
/// <reference path="../Util.ts"/>
var DataTransmitter;
(function (DataTransmitter) {
    var PacketManager = (function () {
        function PacketManager(chunkSize) {
            this._chunkSize = 1024;
            this._chunkSize = chunkSize;
        }
        PacketManager.prototype._pack = function (data) {
            var packedData = new Uint8Array(MessagePack.encode(data));
            return DataTransmitter.Util.split(packedData, this._chunkSize);
        };

        PacketManager.prototype._unpack = function (dataArray) {
            var concatData = DataTransmitter.Util.merge(dataArray);
            return MessagePack.decode(concatData);
        };

        PacketManager.prototype.dataToSendPacketArray = function (data, key) {
            var sentPackets = [];
            var sentDataArray = this._pack(data);
            for (var i = 0; i < sentDataArray.length; i++) {
                var packetPayload = {
                    key: key,
                    packetId: i,
                    maxId: sentDataArray.length - 1,
                    data: btoa(String.fromCharCode.apply(null, sentDataArray[i]))
                };

                sentPackets.push(packetPayload);
            }

            return sentPackets;
        };

        PacketManager.prototype.recvPacketsArrayToData = function (callback) {
            var _this = this;
            var recvDataArray = [];
            var _callback = callback;

            return function (recvPacket) {
                var data = new Uint8Array(atob(recvPacket.data).split("").map(function (c) {
                    return c.charCodeAt(0);
                }));
                recvDataArray.push(new Uint8Array(data));
                if (recvPacket.id == recvPacket.maxID) {
                    var recvData = _this._unpack(recvDataArray);
                    _callback(recvData);
                }
            };
        };
        return PacketManager;
    })();
    DataTransmitter.PacketManager = PacketManager;
})(DataTransmitter || (DataTransmitter = {}));
//# sourceMappingURL=PacketManager.js.map
