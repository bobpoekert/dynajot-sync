// https://github.com/jquery/jquery/blob/7877c4fa73120bc6d21a5fcd302a896f03b23876/src/core.js
/** @license jQuery v1.10.2 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license */
define(function() {

    var res = {};

    res.isFunction = function(fn) {
        return typeof(fn) === 'function';
    };

    res.isUndefined = function(o) {
        return typeof(o) == 'undefined';
    };

    res.isArray = Array.isArray;

    res.isString = function(obj) {
        return typeof(obj) === 'string';
    };

    res.isWindow = function(obj) {
        return obj != null && obj === obj.window;
    };

    res.isNumeric = function(obj) {
        return !isNaN( parseFloat(obj) ) && isFinite( obj );
    };

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

    res.each = function(obj, fn) {
        if (res.isArray(obj)) {
            for (var i=0; i < obj.length; i++) {
                fn(obj[i]);
            }
        } else {
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    fn(obj[k]);
                }
            }
        }
    };

    res.dictIsEmpty = function(obj) {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                return false;
            }
        }
        return true;
    };

    res.dictIsEqual = function(a, b) {
        if (typeof(a) != 'object' || typeof(a) != typeof(b)) {
            return false;
        }
        for (var k in a) {
            if (a[k] != b[k]) {
                return false;
            }
        }
        for (var k in b) {
            if (a[k] != b[k]) {
                return false;
            }
        }
        return true;
    };

    res.arrayIsEqual = function(a, b) {
        if (a.length != b.length) {
            return false;
        }
        for (var i=0; i < a.length; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    };

    res.truthiness = function(obj) {
        if (obj.length !== undefined) {
            return obj.length > 0;
        }
        if (res.isPlainObject(obj)) {
            return !res.dictIsEmpty(obj);
        }
        if (res.isNumeric(obj)) {
            return obj != 0;
        }
        if (res.isFunction(obj)) {
            return true;
        }
    };

    res.map = function(obj, fn) {
        var arr = [];
        res.each(obj, function(el) {
            arr.push(fn(el));
        });
        return arr;
    };

    res.filter = function(obj, fn) {
        var arr = [];
        res.each(function(el) {
            if (fn(el) === true) {
                arr.push(el);
            }
        });
        return arr;
    };

    res.reduce = function(fn, arr, init) {
        if (res.isFunction(arr.reduce)) {
            return arr.reduce(fn, init);
        }
        if (arr.length < 1) {
            return fn();
        }

        if (arr.length < 2) {
            return fn(arr[0]);
        }

        var idx = 0;
        var acc;
        if (res.isUndefined(init)) {
            acc = fn(arr[0], arr[1]);
            idx = 2;
        } else {
            acc = init;
        }

        while (idx < arr.length) {
            acc = fn(acc, arr[idx]);
            idx++;
        }

        return acc;
    };

    res.camelCase = function(string) {
        return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
    };

    res.partial = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function() {
            return fn.apply(this, args.concat(arguments));
        };
    };

    if (Array.prototype.indexOf) {
        res.indexOf = function(arr, el) {
            return arr.indexOf(el);
        };
    } else {
        res.indexOf = function(arr, el) {
            for (var i=0; i < arr.length; i++) {
                if (arr[i] == el) {
                    return i;
                }
            }
            return -1;
        };
    };

    var sentence_splitter = /(<[^>]*>|[^\w\s]+)/;
    res.sentenceSplit = function(s) {
        var parts = s.split(sentence_splitter);
        var res = [];
        for (var i; i < parts.length; i++) {
            var part = parts[i];
            if (i % 2 == 0) {
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
});
