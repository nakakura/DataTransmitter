/**
* Created by nakakura on 3/21/14.
*/
/// <reference path="./messagepack.d.ts"/>
/// <reference path="../Util.ts"/>
var DataTransmitter;
(function (DataTransmitter) {
    var QueueManager = (function () {
        function QueueManager(packetLength) {
            this._queue = new Array(packetLength);
        }
        QueueManager.prototype.insertItem = function (item, callback) {
            if (item.serial == undefined)
                return;
            var serial = item.serial;
            this._queue[serial] = item;
            this._queue[serial].isRecieved = true;
            if (this._didFinish())
                callback(this._queue);
        };

        QueueManager.prototype._didFinish = function () {
            for (var i = 0, len = this._queue.length; i < len; i++) {
                if (this._queue[i] === undefined || this._queue[i].isRecieved === undefined)
                    return false;
                else if (!this._queue[i].isRecieved)
                    return false;
            }

            return true;
        };
        return QueueManager;
    })();
    DataTransmitter.QueueManager = QueueManager;
})(DataTransmitter || (DataTransmitter = {}));
//# sourceMappingURL=QueueManager.js.map
