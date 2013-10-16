// https://github.com/jquery/jquery/blob/7877c4fa73120bc6d21a5fcd302a896f03b23876/src/core.js
/** @license jQuery v1.10.2 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license */
define(["underscore"], function(underscore) {

    var inherit;
    if (Object.create) {
        inherit = function(o) {
            return Object.create(o);
        };
    } else {
        var extender = function(){};
        inherit = function(obj) {

            extender.prototype = obj;
            var res = new extender();
            extender.prototype = null;
            return res;
        };
    }

    var core = inherit(underscore);

    core.inherit = inherit;

    var debug = false;

    core.cl = function () {
        if (debug) {
            switch(arguments.length) {
                case 0:
                    console.log();
                    return;
                case 1:
                    console.log(arguments[0]);
                    return;
                case 2:
                    console.log(arguments[0], arguments[1]);
                    return;
                default:
                    console.log(arguments[0], arguments[1], arguments[2]);
                    return;
            }
        }
    };

    core.ct = function () {
        if (debug) console.trace();
    };

    core.isWindow = function(obj) {
        return obj != null && obj === obj.window;
    };

    core.isNumeric = core.isNumber;

    core.isPlainObject = function(obj) {
        if (typeof(obj) !== 'object' || obj.nodeType || core.isWindow(obj)) {
            return false;
        }

        // Support: Firefox <20
		// The try/catch suppresses exceptions thrown when attempting to access
		// the "constructor" property of certain host objects, ie. |window.location|
		// https://bugzilla.mozilla.org/show_bug.cgi?id=814622
		try {
			if ( obj.constructor &&
					!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}
		} catch ( e ) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
    };

    core.dictMerge = function(a, b) {
        core.each(b, function(v, k) {
            a[k] = v;
        });
    };

    core.arrayMerge = function(a, b, stringify) {
        var b_dict = {};
        var el;
        var s;
        var idx;

        for (i=0; i < b.length; i++) {
            b_dict[stringify(b[i])] = i;
        }
        var res = [];
        for (i=0; i < a.length; i++) {
            el = a[i];
            s = stringify(el);
            res.push(el);
            delete b_dict[s];
        }

        var added_offset = a.length - b.length;
        var splice_index;
        for (var k in b_dict) {
            if (!b_dict.hasOwnProperty(k)) continue;
            idx = b_dict[k];
            el = b[idx];
            splice_index = Math.max(0, idx + added_offset);
            //console.log(splice_index);
            res.splice(splice_index, 0, el);
            added_offset++;
        }
        return res;
    };

    core.mapAll = function(arrs, fn, context) {
        /* @t [[?A...], ...], (?A -> ?A), Dict -> [[?A...], ...] */
        var results = [];
        if (arrs == null) return results;
        var max_length = 0;
        var i;
        for (i=0; i < arrs.length; i++) {
            var l = arrs[i].length;
            if (l > max_length) max_length = l;
        }
        for (i=0; i < l; i++) {
            var round = [];
            for (var j=0; j < arrs.length; j++) {
                round.push(arrs[j][i]);
            }
            results.push(fn.apply(context, round));
        }
        return results;
    };

    core.stringCompare = function(a, b) {
        /* @t String, String -> Number */
        var max = Math.min(a.length, b.length);
        for (var i=0; i < max; i++) {
            var as = a.charCodeAt(i);
            var bs = b.charCodeAt(i);
            if (as != bs) {
                return as - bs;
            }
        }
        return b.length - a.length;
    };

    core.noop = function(){};

    core.identity = function(a) {
        /* @t ?A -> ?A */
        return a;
    };

    core.gattr = function(k) {
        /* @t String -> (Dict -> String) */
        return function(o) {
            return o[k];
        };
    };

    core.unsplat = function(arg_count, fn) {
        if (!fn) {
            fn = arg_count;
            return function() {
                return fn(core.toArray(arguments));
            };
        } else {
            return function() {
                var dst = [];
                var src = core.toArray(arguments);
                for (var i=0; i < arg_count; i++) {
                    dst.push(src.shift());
                }
                dst.push(src);
                return fn.apply(this, dst);
            };
        }
    };

    core.splat = function(fn) {
        return function(arr) {
            return fn.apply(this, arr);
        };
    };

    core.dictIsEmpty = core.isEmpty;
    core.dictIsEqual = core.isEqual;

    core.truthiness = function(obj) {
        /* ?P -> Boolean */
        switch(obj) {
            case 0:
            case false:
            case null:
            case undefined:
                return false;
            case true:
                return true;
        }
        if (typeof(obj) === 'string') {
            return /[^\s]/.test(obj);
        }
        if (core.isNumeric(obj)) {
            return true;
        }
        if (obj.length !== undefined) {
            return obj.length > 0;
        }
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                return true;
            }
        }
        if (obj.nodeType) return true;
        return false;
    };

    core.removeWhitespace = function(s) {
        /* @t String -> String */
        return s.replace(/\s/g, '');
    };

    core.whitespaceEqual = function(a, b) {
        /* @t String, String -> Boolean */
        if (!(core.truthiness(a) === core.truthiness(b))) {
            return false;
        }
        return core.removeWhitespace(a) == core.removeWhitespace(b);
    };

    /* @defrecord Future
    *   (): (?P -> null), (?P -> null)? -> null
    *   addReader: (?P -> null), (?P -> null)? -> null
    *   fail: null -> null
    *   fire: ?P, ... -> null
    */

    core.future = function() {
        /* @t () -> Future */
        var success_callbacks = [];
        var failure_callbacks = [];
        var failed = false;
        var fired = false;
        var data = null;
        var await = function(success, fail) {
            if (fired) {
                (failed ? fail : success).apply(data[0], data[1]);
            } else {
                success_callbacks.push(success);
                failure_callbacks.push(fail);
            }
        };

        await.addReader = await;
        
        await.fail = function() {
            /* @t () -> null */
            if (fired) return;
            data = [this, core.toArray(arguments)];
            fired = true;
            failed = true;
            while(failure_callbacks.length > 0) {
                failure_callbacks.shift().apply(this, arguments);
            }
        };
        await.fire = function() {
            /* @t () -> null */
            if (fired) return;
            data = [this, core.toArray(arguments)];
            fired = true;
            while(success_callbacks.length > 0) {
                success_callbacks.shift().apply(this, arguments);
            }
        };
        return await;
    };

    core.multi = function(callback) {
        /* @t (?A... -> null) -> Multi(?A) */
        var slots = [];
        var delivered = [];
        var item_count = 0;
        var delivered_count = 0;
        var started = false;
        var fired = false;

        var maybeFire = function() {
            if (started && !fired && delivered_count >= item_count) {
                fired = true;
                callback(slots);
            }
        };

        var deliverItem = function(index, item) {
            slots[index] = item;
            if (!delivered[index]) {
                delivered_count++;
                delivered[index] = true;
            }
            // console.log(index, item_count, delivered_count, item);
            maybeFire();
        };

        return {
            addValue: function(value) {
                var old_count = item_count;
                slots.push(value);
                delivered.push(true);
                item_count++;
                delivered_count++;
            },
            getCallback: function() {
                if (started) return core.noop;
                var old_count = item_count;
                slots.push(null);
                delivered.push(false);
                item_count++;
                return core.partial(deliverItem, old_count);
            },
            start: function() {
                started = true;
                maybeFire();
            }
        };
    };

    /* @defrecord Pipe(?P)
    *   addReader: (?P -> ...) -> Number
    *   buffer: [?P, ...]
    *   removeReader: Number -> null
    *   write: ?P -> null
    */

    core.pipe = function() {
        /* @t () -> Pipe */

        var buffer = [];
        var callbacks = [];

        return {
            addReader: function(fn) {
                var idx = callbacks.length;
                callbacks.push(fn);
                while(buffer.length > 0) {
                    fn(buffer.shift());
                }
                return idx;
            },
            buffer: buffer,
            removeReader: function(idx) {
                callbacks[idx] = null;
            },
            write: function(datum) {
                if (core.some(callbacks)) {
                    for (var i=0; i < callbacks.length; i++) {
                        var cb = callbacks[i];
                        if (cb) {
                            cb(datum);
                        }
                    }
                } else {
                    buffer.push(datum);
                }
            }
        };
    };

    core.maybe_function = function(val) {
        /* @t ?P -> (... -> ...) */
        return typeof(val) === 'function' ? val : function() { return val; };
    };

    core.uniqueDebounce = function(fn, interval) {
        /* @t (?P... -> null) -> (?P... -> null) */
        if (!interval) interval = 100;
        var locked = false;
        var arg_set = [];

        var debounceUnlock = function() {
            while(arg_set.length > 0) {
                fn(arg_set.shift());
            }
            locked = false;
        };

        return function(arg) {
            if (!locked) {
                fn(arg);
                locked = true;
                setTimeout(debounceUnlock, interval);
            } else if (!core.contains(arg_set, arg)) {
                arg_set.push(arg);
            }
        };
    };

    core.reTester = function(re) {
        /* @t RegExp -> (String -> Boolean) */
        return function(item) {
            return re.test(item);
        };
    };

    core.hasOnlyKeys = function(dict, keys) {
        /* @t Dict, [String, ...] -> Boolean */
        for (var k in dict) {
            if (!dict.hasOwnProperty(k)) continue;
            if (core.indexOf(keys, k) == -1) return false;
        }
        return true;
    };

    core.clean = function(arr) {
        /* @t [?P, ...] -> [?P, ...] */
        return core.filter(arr, core.truthiness);
    };

    var rdashAlpha = /-([\da-z])/gi;
    var fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

    core.camelCase = function(string) {
        /* @t String -> String */
        return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
    };

    core.replace = function(arr, fn) {
        /* @t [?P, ...], (?P -> ?P/false) -> [?P, ...] */
        for (var i=0; i < arr.length; i++) {
            var e = arr[i];
            var r = fn(e);
            if (r !== false) {
                arr[i] = r;
            }
        }
    };

    core.indexOf = function(arr, el, comparator, start) {
        /* @t [?P, ...], ?P -> Number */
        start = typeof(start) == 'undefined' ? 0 : start;
        if (comparator) {
            for (start; start < arr.length; start++) {
                if (comparator(el, arr[start])) {
                    return start;
                }
            }
            return -1;
        } else {
            if (arr.indexOf && start === 0) {
                return arr.indexOf(el);
            }
            for (start; start < arr.length; start++) {
                if (arr[start] == el) {
                    return start;
                }
            }
            return -1;
        }
    };


    var sentence_splitter = /(<[^>]*>|[^\w\s]+)/;
    core.sentenceSplit = function(s) {
        /* @t String -> [[String, ...], [Number, ...]] */
        var parts = s.split(sentence_splitter);
        var res = [];
        for (var i=0; i < parts.length; i++) {
            var part = parts[i];
            if (i % 2 === 0) {
                res.push(part);
            } else {
                res[res.length-1] = res[res.length-1] + part;
            }
        }
        var character_offset = 0;
        var offsets = [];
        for (var i=0; i < res.length; i++) {
            offsets.push(character_offset);
            character_offset += res[i].length;
        }

        return [res, offsets];
    };

    core.logsErrors = function(fn) {
        /* @t (?A, ?_... -> ?B) -> (?A, ?_... -> ?B) */
        return fn;
        if (console) {
            return function() {
                var e;
                try {
                    return fn.apply(this, arguments);
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
        } else {
            return fn;
        }
    };

    core.throttle = function(func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        options || (options = {});
        var later = function() {
          previous = options.leading === false ? 0 : new Date();
          timeout = null;
          result = func.apply(context, args);
        };
        return function() {
          var now = new Date();
          if (!previous && options.leading === false) previous = now;
          var remaining = wait - (now - previous);
          context = this;
          args = arguments;
          if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
          } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
          }
          return result;
        };
    };

    core.extend = function() {
        var options, name, src, copy, copyIsArray, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;

            // Handle a deep copy situation
            if ( typeof target === "boolean" ) {
                deep = target;
                target = arguments[1] || {};
                // skip the boolean and the target
                i = 2;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if ( typeof target !== "object" && !core.isFunction(target) ) {
                target = {};
            }

            // extend jQuery itself if only one argument is passed
            if ( length === i ) {
                target = this;
                --i;
            }

            for ( ; i < length; i++ ) {
                // Only deal with non-null/undefined values
                if ( (options = arguments[ i ]) != null ) {
                    // Extend the base object
                    for ( name in options ) {
                        src = target[ name ];
                        copy = options[ name ];

                        // Prevent never-ending loop
                        if ( target === copy ) {
                            continue;
                        }

                        // Recurse if we're merging plain objects or arrays
                        if ( deep && copy && ( core.isPlainObject(copy) || (copyIsArray = core.isArray(copy)) ) ) {
                            if ( copyIsArray ) {
                                copyIsArray = false;
                                clone = src && core.isArray(src) ? src : [];

                            } else {
                                clone = src && core.isPlainObject(src) ? src : {};
                            }

                            // Never move original objects, clone them
                            target[ name ] = core.extend( deep, clone, copy );

                        // Don't bring in undefined values
                        } else if ( copy !== undefined ) {
                            target[ name ] = copy;
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        };

    return core;
});
