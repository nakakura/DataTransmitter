/**
 * Created by nakakura on 3/21/14.
 */

/// <reference path="./typings/tsd.d.ts"/>

module DataTransmitter{
    export class Util{
        public static split(array: Uint8Array, chunkSize: number){
            var chunkNum = Math.ceil(array.length / chunkSize);
            var retArray: Array<Uint8Array> = [];

            for(var i = 0; i < chunkNum; i++){
                var lastByte = chunkSize * (i + 1);
                if(lastByte > array.length) lastByte = array.length;
                retArray.push(array.subarray(chunkSize * i, lastByte));
            }

            return retArray;
        }

        public static merge(dataArray: Array<Uint8Array>): Uint8Array{
            if(dataArray.length < 2) return dataArray[0];

            var sourceArrayLength = dataArray.length;
            var sourceChunkSize = dataArray[0].length;
            var dataLength = sourceChunkSize * (sourceArrayLength - 1) + dataArray[sourceArrayLength - 1].length;
            var retData: Uint8Array = new Uint8Array(dataLength);
            for(var offset = 0; offset < sourceArrayLength; offset++){
                retData.set(dataArray[offset], sourceChunkSize * offset);
            }

            return retData;
        }
    }

    export enum DataType{
        binary,
        text
    }

    export enum SocketType{
        websocket,
        webrtc,
        peerjs
    }
}

