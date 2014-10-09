/**
* Created by nakakura on 3/21/14.
*/
/// <reference path="./typings/tsd.d.ts"/>
var DataTransmitter;
(function (DataTransmitter) {
    var Util = (function () {
        function Util() {
        }
        Util.split = function (array, chunkSize) {
            var chunkNum = Math.ceil(array.length / chunkSize);
            var retArray = [];

            for (var i = 0; i < chunkNum; i++) {
                var lastByte = chunkSize * (i + 1);
                if (lastByte > array.length)
                    lastByte = array.length;
                retArray.push(array.subarray(chunkSize * i, lastByte));
            }

            return retArray;
        };

        Util.merge = function (dataArray) {
            if (dataArray.length < 2)
                return dataArray[0];

            var sourceArrayLength = dataArray.length;
            var sourceChunkSize = dataArray[0].length;
            var dataLength = sourceChunkSize * (sourceArrayLength - 1) + dataArray[sourceArrayLength - 1].length;
            var retData = new Uint8Array(dataLength);
            for (var offset = 0; offset < sourceArrayLength; offset++) {
                retData.set(dataArray[offset], sourceChunkSize * offset);
            }

            return retData;
        };
        return Util;
    })();
    DataTransmitter.Util = Util;

    (function (DataType) {
        DataType[DataType["binary"] = 0] = "binary";
        DataType[DataType["text"] = 1] = "text";
    })(DataTransmitter.DataType || (DataTransmitter.DataType = {}));
    var DataType = DataTransmitter.DataType;

    (function (SocketType) {
        SocketType[SocketType["websocket"] = 0] = "websocket";
        SocketType[SocketType["webrtc"] = 1] = "webrtc";
        SocketType[SocketType["peerjs"] = 2] = "peerjs";
    })(DataTransmitter.SocketType || (DataTransmitter.SocketType = {}));
    var SocketType = DataTransmitter.SocketType;
})(DataTransmitter || (DataTransmitter = {}));
//# sourceMappingURL=Util.js.map
