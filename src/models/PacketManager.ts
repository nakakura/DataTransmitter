/**
 * Created by nakakura on 3/21/14.
 */

/// <reference path="./messagepack.d.ts"/>
/// <reference path="../Util.ts"/>

module DataTransmitter{
    export interface PacketIf{
        key: string;
        packetId: number;
        maxId: number;
        data: any;
    }

    export class PacketManager{
        private _chunkSize: number = 1024;

        constructor(chunkSize: number){
            this._chunkSize = chunkSize;
        }

        private _pack(data: any): Array<Uint8Array>{
            var packedData = new Uint8Array(MessagePack.encode(data));
            return Util.split(packedData, this._chunkSize);
        }

        private _unpack(dataArray: Array<Uint8Array>): any{
            var concatData = Util.merge(dataArray);
            return MessagePack.decode(concatData);
        }

        public dataToSendPacketArray(data: any, key: string): Array<PacketIf>{
            var sentPackets: Array<PacketIf> = [];
            var sentDataArray = this._pack(data);
            for(var i = 0; i < sentDataArray.length; i++){
                var packetPayload: PacketIf = {
                    key: key,
                    packetId: i,
                    maxId: sentDataArray.length - 1,
                    data: btoa(String.fromCharCode.apply(null, sentDataArray[i]))
                };

                sentPackets.push(packetPayload);
            }

            return sentPackets;
        }

        public recvPacketsArrayToData(callback: (any)=>void): any{
            var recvDataArray: Array<Uint8Array> = [];
            var _callback = callback;

            return (recvPacket: any) =>{
                var data = new Uint8Array(atob(recvPacket.data).split("").map(function(c) {
                    return c.charCodeAt(0);
                }));
                recvDataArray.push(new Uint8Array(data));
                if(recvPacket.id == recvPacket.maxID){
                    var recvData = this._unpack(recvDataArray);
                    _callback(recvData);
                }
            };
        }
    }
}

