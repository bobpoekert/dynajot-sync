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

    var res = inherit(underscore);

    res.inherit = inherit;

    res.isWindow = function(obj) {
        return obj != null && obj === obj.window;
    };

    res.isNumeric = res.isNumber;

    res.isPlainObject = function(obj) {
        if (typeof(obj) !== 'object' || obj.nodeType || res.isWindow(obj)) {
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

    res.mapAll = function(arrs, fn, context) {
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

    res.gattr = function(k) {
        /* @t String -> (Dict -> String) */
        return function(o) {
            return o[k];
        }
    };

    res.splat = function(fn) {
        /* @t (... -> ?P) -> ([...] -> ?P) */
        return function(arr) {
            return fn.apply(this, arr);
        };
    };

    res.dictIsEmpty = res.isEmpty;
    res.dictIsEqual = res.isEqual;

    res.truthiness = function(obj) {
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
        if (res.isNumeric(obj)) {
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
        return false;
    };

    res.removeWhitespace = function(s) {
        /* @t String -> String */
        return s.replace(/\s/g, '');
    };

    res.whitespaceEqual = function(a, b) {
        /* @t String, String -> Boolean */
        if (!(res.truthiness(a) === res.truthiness(b))) {
            return false;
        }
        return res.removeWhitespace(a) == res.removeWhitespace(b);
    };

    /* @defrecord Future(?P)
    *   (): (?P -> null), (?P -> null)? -> null
    *   addReader: (?P -> null), (?P -> null)? -> null
    *   fail: null -> null
    *   fire: ?P, ... -> null
    */

    res.future = function() {
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
            if (fired) return;
            data = [this, res.toArray(arguments)];
            fired = true;
            failed = true;
            while(failure_callbacks.length > 0) {
                failure_callbacks.shift().apply(this, arguments);
            }
        };
        await.fire = function() {
            if (fired) return;
            data = [this, res.toArray(arguments)];
            fired = true;
            while(success_callbacks.length > 0) {
                success_callbacks.shift().apply(this, arguments);
            }
        };
        return await;
    };

    /* @defrecord Pipe(?P)
    *   addReader: (?P -> ...) -> Number
    *   buffer: [?P, ...]
    *   removeReader: Number -> null
    *   write: ?P -> null
    */

    res.pipe = function() {
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
                if (res.some(callbacks)) {
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

    res.maybe_function = function(val) {
        /* @t ?P -> (... -> ...) */
        return typeof(val) === 'function' ? val : function() { return val; };
    };

    res.uniqueDebounce = function(fn, interval) {
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
            } else if (!res.contains(arg_set, arg)) {
                arg_set.push(arg);
            }
        };
    };

    res.reTester = function(re) {
        /* @t RegExp -> (String -> Boolean) */
        return function(item) {
            return re.test(item);
        };
    };

    res.hasOnlyKeys = function(dict, keys) {
        for (var k in dict) {
            if (!dict.hasOwnProperty(k)) continue;
            if (res.indexOf(keys, k) == -1) return false;
        }
        return true;
    };

    res.clean = function(arr) {
        /* @t [?P, ...] -> [?P, ...] */
        return res.filter(arr, res.truthiness);
    };

    var rdashAlpha = /-([\da-z])/gi;
    var fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

    res.camelCase = function(string) {
        /* @t String -> String */
        return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
    };

    res.replace = function(arr, fn) {
        /* @t [?P, ...], (?P -> ?P/false) -> [?P, ...] */
        for (var i=0; i < arr.length; i++) {
            var e = arr[i];
            var r = fn(e);
            if (r !== false) {
                arr[i] = r;
            }
        }
    };

    res.indexOf = function(arr, el) {
        /* @t [?P, ...], ?P -> Number */
        if (arr.indexOf) {
            return arr.indexOf(el);
        }
        for (var i=0; i < arr.length; i++) {
            if (arr[i] == el) {
                return i;
            }
        }
        return -1;
    };

    var sentence_splitter = /(<[^>]*>|[^\w\s]+)/;
    res.sentenceSplit = function(s) {
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

    res.isTextNode = function(node) {
        /* @t DOMNode -> Boolean */
        return !!(node && node.nodeType === 3);
    };

    res.logsErrors = function(fn) {
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

    res.extend = function() {
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
            if ( typeof target !== "object" && !res.isFunction(target) ) {
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
                        if ( deep && copy && ( res.isPlainObject(copy) || (copyIsArray = res.isArray(copy)) ) ) {
                            if ( copyIsArray ) {
                                copyIsArray = false;
                                clone = src && res.isArray(src) ? src : [];

                            } else {
                                clone = src && res.isPlainObject(src) ? src : {};
                            }

                            // Never move original objects, clone them
                            target[ name ] = res.extend( deep, clone, copy );

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

    return res;
});
