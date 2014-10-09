/**
 * Created by nakakura on 3/21/14.
 */

declare module UUPAA{
    export interface MessagePackStatic{
        encode(data: any, length?: number);
        decode(data: any);
    }
}

declare var MessagePack: UUPAA.MessagePackStatic;
