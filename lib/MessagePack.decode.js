//{@messagepackdecode
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

// --- class / interfaces ----------------------------------
function MessagePack_decode(source) { // @arg Uint8Array - source
                                      // @ret Any
//{@dev
    $valid($type(source, "Uint8Array"), MessagePack_decode, "source");
//}@dev

    var view = { source: source, index: -1 };

    return _decode(view);
}

// --- implements ------------------------------------------
function _decode(view) { // @arg Object - { source, index }
                         // @ret Any
                         // @recursive
    var num = 0;
    var type = view.source[++view.index];

    if (type >= 0xe0) {             // Negative FixNum (111x xxxx) (-32 ~ -1)
        return type - 0x100;
    }
    if (type < 0xc0) {
        if (type < 0x80) {          // Positive FixNum (0xxx xxxx) (0 ~ 127)
            return type;
        }
        if (type < 0x90) {          // FixMap   (1000 xxxx)
            num  = type - 0x80;
            type = 0x80;
        } else if (type < 0xa0) {   // FixArray (1001 xxxx)
            num  = type - 0x90;
            type = 0x90;
        } else if (type < 0xc0) {   // FixRaw   (101x xxxx)
            num  = type - 0xa0;
            type = 0xa0;
        }
    }

    switch (type) {
    case 0xc0: return null;
    case 0xc2: return false;
    case 0xc3: return true;
    case 0xca: return _decodeFloat(view);
    case 0xcb: return _decodeDouble(view);
    case 0xcf: // uint64
    case 0xce: // uint32
    case 0xcd: // uint16
    case 0xcc: // uint8
        return _decodeUint(view, type, num);
    case 0xd3: // int64
    case 0xd2: // int32
    case 0xd1: // int16
    case 0xd0: // int8
        return _decodeInt(view, type, num);
    case 0xdb: // Raw32
    case 0xda: // Raw16
    case 0xa0: // FixRaw
        return _decodeString(view, type, num);
    case 0xdf: // Map32
    case 0xde: // Map16
    case 0x80: // FixMap
        return _decodeObject(view, type, num);
    case 0xdd: // Array32
    case 0xdc: // Array16
    case 0x90: // FixArray
        return _decodeArray(view, type, num);
    }
    throw new TypeError("UNKNOWN_TYPE");
}

function _decodeFloat(view) {
    var num  = view.source[++view.index] * 0x1000000 +
              (view.source[++view.index] << 16) +
              (view.source[++view.index] <<  8) +
               view.source[++view.index];
    var sign =  num > 0x7fffffff;    //  1bit
    var exp  = (num >> 23) & 0xff;   //  8bits
    var frac =  num & 0x7fffff;      // 23bits

    if (!num || num === 0x80000000) { // 0.0 or -0.0
        return 0;
    }
    if (exp === 0xff) { // NaN or Infinity
        return frac ? NaN : Infinity;
    }
    return (sign ? -1 : 1) * (frac | 0x800000) * Math.pow(2, exp - 127 - 23); // 127: bias
}

function _decodeDouble(view) {
    var num  = view.source[++view.index] * 0x1000000 +
              (view.source[++view.index] << 16) +
              (view.source[++view.index] <<  8) +
               view.source[++view.index];
    var sign =  num > 0x7fffffff;    //  1bit
    var exp  = (num >> 20) & 0x7ff;  // 11bits
    var frac =  num & 0xfffff;       // 52bits - 32bits (high word)

    if (!num || num === 0x80000000) { // 0.0 or -0.0
        view.index += 4;
        return 0;
    }
    if (exp === 0x7ff) { // NaN or Infinity
        view.index += 4;
        return frac ? NaN : Infinity;
    }
    num =  view.source[++view.index] * 0x1000000 +
          (view.source[++view.index] << 16) +
          (view.source[++view.index] <<  8) +
           view.source[++view.index];
    return (sign ? -1 : 1) * ( (frac | 0x100000) *
                               Math.pow(2, exp - 1023 - 20) + // 1023: bias
                               num * Math.pow(2, exp - 1023 - 52) );
}

function _decodeUint(view, type, num) {
    switch (type) {
    case 0xcf:  num =  view.source[++view.index] * 0x1000000 +
                      (view.source[++view.index] << 16) +
                      (view.source[++view.index] <<  8) +
                       view.source[++view.index];
                return num * 0x100000000 +
                       view.source[++view.index] * 0x1000000 +
                      (view.source[++view.index] << 16) +
                      (view.source[++view.index] <<  8) +
                       view.source[++view.index];
    case 0xce:  num += view.source[++view.index] * 0x1000000 +
                      (view.source[++view.index] << 16);
    case 0xcd:  num += view.source[++view.index] <<  8;
    case 0xcc:  num += view.source[++view.index];
    }
    return num;
}

function _decodeInt(view, type, num) {
    switch (type) {
    case 0xd3:  num = view.source[++view.index];
                if (num & 0x80) { // sign -> avoid overflow
                    return ((num                       ^ 0xff) * 0x100000000000000 +
                            (view.source[++view.index] ^ 0xff) *   0x1000000000000 +
                            (view.source[++view.index] ^ 0xff) *     0x10000000000 +
                            (view.source[++view.index] ^ 0xff) *       0x100000000 +
                            (view.source[++view.index] ^ 0xff) *         0x1000000 +
                            (view.source[++view.index] ^ 0xff) *           0x10000 +
                            (view.source[++view.index] ^ 0xff) *             0x100 +
                            (view.source[++view.index] ^ 0xff) + 1) * -1;
                }
                return num                       * 0x100000000000000 +
                       view.source[++view.index] *   0x1000000000000 +
                       view.source[++view.index] *     0x10000000000 +
                       view.source[++view.index] *       0x100000000 +
                       view.source[++view.index] *         0x1000000 +
                       view.source[++view.index] *           0x10000 +
                       view.source[++view.index] *             0x100 +
                       view.source[++view.index];
    case 0xd2:  num =  view.source[++view.index] * 0x1000000 +
                      (view.source[++view.index] << 16) +
                      (view.source[++view.index] <<  8) +
                       view.source[++view.index];
                return num < 0x80000000 ? num : num - 0x100000000; // 0x80000000 * 2
    case 0xd1:  num = (view.source[++view.index] << 8) +
                       view.source[++view.index];
                return num < 0x8000 ? num : num - 0x10000; // 0x8000 * 2
    case 0xd0:  num =  view.source[++view.index];
                return num < 0x80 ? num : num - 0x100; // 0x80 * 2
    }
    return 0;
}

function _decodeString(view, type, num) {
    switch (type) {
    case 0xdb:  num +=  view.source[++view.index] * 0x1000000 + (view.source[++view.index] << 16);
    case 0xda:  num += (view.source[++view.index] << 8)       +  view.source[++view.index];
    case 0xa0:  view.index += num;
    }
    return _ConvertUTF8Uint8ArrayToString(view.source, view.index - num + 1, num);
}

function _decodeObject(view, type, num) {
    var size = 0;
    var key = "";
    var obj = {};

    switch (type) {
    case 0xdf:  num +=  view.source[++view.index] * 0x1000000 + (view.source[++view.index] << 16);
    case 0xde:  num += (view.source[++view.index] << 8)       +  view.source[++view.index];
    case 0x80:  while (num--) {
                    // make key/value pair
                    size = view.source[++view.index] - 0xa0;
                    key  = _ConvertUTF8Uint8ArrayToString(view.source, view.index + 1, size);
                    view.index += size;
                    obj[key] = _decode(view);
                }
    }
    return obj;
}

function _decodeArray(view, type, num) {
    var ary = [];

    switch (type) {
    case 0xdd:  num +=  view.source[++view.index] * 0x1000000 + (view.source[++view.index] << 16);
    case 0xdc:  num += (view.source[++view.index] << 8)       +  view.source[++view.index];
    case 0x90:  while (num--) {
                    ary.push( _decode(view) );
                }
    }
    return ary;
}

function _ConvertUTF8Uint8ArrayToString(source, // @arg UTF8Uint8Array
                                        offset, // @arg Integer
                                        size) { // @arg Integer
                                                // @ret String
    var view = source.subarray(offset, offset + size);

    return decodeURIComponent( escape( _convertTypedArrayToString(view) ) );
}

function _convertTypedArrayToString(source) { // @arg TypedArray|IntegerArray(= undefined): [0xff, ...]
                                              // @ret BinaryString:
                                              // @desc source code copy from DataType.js::DataType.Array.toString
    if (!source) {
        return "";
    }
    var rv = [], i = 0, iz = source.length, bulkSize = 32000;
    var method = Array.isArray(source) ? "slice" : "subarray";

    // Avoid String.fromCharCode.apply(null, BigArray) exception
    if (iz < bulkSize) {
        return String.fromCharCode.apply(null, source);
    }
    for (; i < iz; i += bulkSize) {
        rv.push( String.fromCharCode.apply(null, source[method](i, i + bulkSize)) );
    }
    return rv.join("");
}

// --- validate / assertions -------------------------------
//{@dev
function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
//function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $some(val, str, ignore) { return global["Valid"] ? global["Valid"].some(val, str, ignore) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

// --- exports ---------------------------------------------
global["MessagePack_" in global ? "MessagePack_" : "MessagePack"]["decode"] = MessagePack_decode; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule
//}@messagepackdecode

