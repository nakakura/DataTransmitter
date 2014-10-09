/**
 * Created by nakakura on 3/21/14.
 */

/// <reference path="./messagepack.d.ts"/>
/// <reference path="../Util.ts"/>

module DataTransmitter{
    export class QueueManager{
        private _queue: Array<any>;

        constructor(packetLength: number){
            this._queue = new Array(packetLength);
        }

        public insertItem(item: any, callback: (any)=>void){
            if(item.serial == undefined) return;
            var serial = item.serial;
            this._queue[serial] = item;
            this._queue[serial].isRecieved = true;
            if(this._didFinish()) callback(this._queue);
        }

        private _didFinish(): boolean {
            for(var i = 0, len = this._queue.length; i < len; i++){
                if(this._queue[i] === undefined || this._queue[i].isRecieved === undefined) return false;
                else if(!this._queue[i].isRecieved) return false;
            }

            return true;
        }
    }
}

