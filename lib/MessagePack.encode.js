//{@messagepackencode
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

var MAX_DEPTH = 512; // cyclic reference safe guard

// --- class / interfaces ----------------------------------
function MessagePack_encode(source,       // @arg Any
                            bufferSize) { // @arg Integer = 16384 - buffer size
                                          // @ret Uint8Array
//{@dev
    $valid($type(bufferSize, "Integer|omit"), MessagePack_encode, "bufferSize");
//}@dev

    var view = _malloc(bufferSize || 16384); // 1024 * 16

    _encode(view, source, 0);

    return view.buffer.subarray(0, view.offset);
}

// --- implements ------------------------------------------
function _encode(view, source, depth) {
    if (++depth >= MAX_DEPTH) {
        throw new TypeError("CYCLIC_REFERENCE_ERROR");
    }
    if (view.offset > view.size) {
        throw new RangeError("INDEX_IS_OUT_OF_RANGE");
    }
    if (source === null || source === undefined) {
        view.buffer[view.offset++] = 0xc0;
    } else {
        switch (typeof source) {
        case "boolean": view.buffer[view.offset++] = source ? 0xc3 : 0xc2; break;
        case "number":  _encodeNumber(view, source); break;
        case "string":  _encodeString(view, source); break;
        default:
            if (Array.isArray(source)) {
                _encodeArray(view, source, depth);
            } else if (source.constructor === ({}).constructor) { // isObject
                _encodeObject(view, source, depth);
            } else {
                throw new TypeError("INVALID_TYPE");
            }
        }
    }
}

function _encodeArray(view, source, depth) {
    // source.length < 0x10        -> FixArray
    // source.length < 0x10000     -> Array16
    // source.length < 0x100000000 -> Array32
    var iz = source.length;

    if (iz < 0x10) { // FixArray
        view.buffer[view.offset++] = 0x90 + iz;
    } else if (iz < 0x10000) { // Array16
        view.buffer.set([0xdc, iz >>  8, iz], view.offset);
        view.offset += 3;
    } else if (iz < 0x100000000) { // Array32
        view.buffer.set([0xdd, iz >> 24, iz >> 16, iz >>  8, iz], view.offset);
        view.offset += 5;
    }

    for (var i = 0; i < iz; ++i) {
        _encode(view, source[i], depth);
    }
}

function _encodeObject(view, source, depth) {
    // source.length < 0x10        -> FixMap
    // source.length < 0x10000     -> Map16
    // source.length < 0x100000000 -> Map32
    var keys = Object.keys(source), iz = keys.length;

    if (iz < 0x10) { // FixMap
        view.buffer[view.offset++] = 0x80 + iz;
    } else if (iz < 0x10000) { // Map16
        view.buffer.set([0xde, iz >>  8, iz], view.offset);
        view.offset += 3;
    } else if (iz < 0x100000000) { // Map32
        view.buffer.set([0xdf, iz >> 24, iz >> 16, iz >>  8, iz], view.offset);
        view.offset += 5;
    }

    for (var i = 0; i < iz; ++i) { // uupaa-looper
        var key = keys[i];

        _encodeString(view, key);
        _encode(view, source[key], depth);
    }
}

function _encodeNumber(view, source) {
    var high = 0;
    var low  = 0;
    var sign = 0;
    var exp  = 0;
    var frac = 0;

    if (source !== source) { // quiet NaN
        view.buffer.set([0xcb, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff], view.offset);
        view.offset += 9;
    } else if (source === Infinity) { // positive infinity
        view.buffer.set([0xcb, 0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], view.offset);
        view.offset += 9;
    } else if (Math.floor(source) === source) { // INT or UINT
        if (source < 0) {
            // --- negative ---
            if (source >= -32) {                // fixnum -> [111xxxxx]
                view.buffer[view.offset++] = 0xe0 + source + 32;
            } else if (source > -0x80) {        // int 8  -> [0xd0, value]
                view.buffer[view.offset++] = 0xd0;
                view.buffer[view.offset++] = source + 0x100;
            } else if (source > -0x8000) {      // int 16 -> [0xd1, value x 2]
                source += 0x10000;
                view.buffer.set([0xd1, source >>  8, source], view.offset);
                view.offset += 3;
            } else if (source > -0x80000000) {  // int 32 -> [0xd2, value x 4]
                source += 0x100000000;
                view.buffer.set([0xd2, source >> 24, source >> 16,
                                       source >>  8, source], view.offset);
                view.offset += 5;
            } else {                            // int 64 -> [0xd3, value x 8]
                high = Math.floor(source / 0x100000000);
                low  = source & 0xffffffff;
                view.buffer.set([0xd3, high >> 24, high >> 16, high >>  8, high,
                                       low  >> 24, low  >> 16, low  >>  8, low], view.offset);
                view.offset += 9;
            }
        } else {
            // --- positive ---
            if (source < 0x80) {                // fixnum  -> [value]
                view.buffer[view.offset++] = source;
            } else  if (source < 0x100) {       // uint 8  -> [0xcc, value]
                view.buffer[view.offset++] = 0xcc;
                view.buffer[view.offset++] = source;
            } else if (source < 0x10000) {      // uint 16 -> [0xcd, value x 2]
                view.buffer.set([0xcd, source >>  8, source], view.offset);
                view.offset += 3;
            } else if (source < 0x100000000) {  // uint 32 -> [0xce, value x 4]
                view.buffer.set([0xce, source >> 24, source >> 16,
                                       source >>  8, source], view.offset);
                view.offset += 5;
            } else {                            // uint 64 -> [0xcf, value x 8]
                high = Math.floor(source / 0x100000000);
                low  = source & 0xffffffff;
                view.buffer.set([0xcf, high >> 24, high >> 16, high >>  8, high,
                                       low  >> 24, low  >> 16, low  >>  8, low], view.offset);
                view.offset += 9;
            }
        }
    } else { // --- double ---
        // THX!! @edvakf
        // http://javascript.g.hatena.ne.jp/edvakf/20101128/1291000731
        sign = source < 0;
        if (sign) {
            source *= -1;
        }

        // add offset 1023 to ensure positive
        exp  = ((Math.log(source) / Math.LN2) + 1023) | 0;

        // shift 52 - (exp - 1023) bits to make integer part exactly 53 bits,
        // then throw away trash less than decimal point
        frac = source * Math.pow(2, 52 + 1023 - exp);

        //  S+-Exp(11)--++-----------------Fraction(52bits)-----------------------+
        //  ||          ||                                                        |
        //  v+----------++--------------------------------------------------------+
        //  00000000|00000000|00000000|00000000|00000000|00000000|00000000|00000000
        //  6      5    55  4        4        3        2        1        8        0
        //  3      6    21  8        0        2        4        6
        //
        //  +----------high(32bits)-----------+ +----------low(32bits)------------+
        //  |                                 | |                                 |
        //  +---------------------------------+ +---------------------------------+
        //  3      2    21  1        8        0
        //  1      4    09  6
        low  = frac & 0xffffffff;
        if (sign) {
            exp |= 0x800;
        }
        high = ((frac / 0x100000000) & 0xfffff) | (exp << 20);

        view.buffer.set([0xcb, high >> 24, high >> 16, high >>  8, high,
                               low  >> 24, low  >> 16, low  >>  8, low], view.offset);
        view.offset += 9;
    }
}

function _encodeString(view, source) {
    // source.length < 0x20        -> FixRaw
    // source.length < 0x10000     -> Raw16
    // source.length < 0x100000000 -> Raw32
    var utf8 = _ConvertStringToUTF8Uint8Array(source);
    var size = utf8.length;

    if (size < 0x20) {                  // FixRaw
        view.buffer[view.offset++] = 0xa0 + size;
    } else if (size < 0x10000) {        // Raw16
        view.buffer.set([0xda, size >>  8, size], view.offset);
        view.offset += 3;
    } else if (size < 0x100000000) {    // Raw32
        view.buffer.set([0xdb, size >> 24, size >> 16, size >>  8, size], view.offset);
        view.offset += 5;
    }
    view.buffer.set(utf8, view.offset);
    view.offset += size;
}

function _ConvertStringToUTF8Uint8Array(source) { // @arg String
                                                  // @ret UTF8Uint8Array
    var utf8String = unescape( encodeURIComponent(source) );
    var result = new Uint8Array(utf8String.length);

    for (var i = 0, iz = utf8String.length; i < iz; ++i) {
        result[i] = utf8String.charCodeAt(i);
    }
    return result;
}

function _malloc(newBufferSize, // @arg Integer
                 oldArray) {    // @arg Uint8Array = null
                                // @ret Object - { array, offset }
                                // @desc allocate new Uint8Array
    var newBuffer = new Uint8Array(newBufferSize);
    var offset = 0;

    if (oldArray) {
        newBuffer.set( oldArray.buffer.slice(0) ); // clone
        offset = oldArray.length;
    }
    return { buffer: newBuffer, size: newBufferSize, offset: offset };
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
global["MessagePack_" in global ? "MessagePack_" : "MessagePack"]["encode"] = MessagePack_encode; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule
//}@messagepackencode

