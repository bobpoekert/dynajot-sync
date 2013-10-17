define(["core", "msgpack"], function(core, msgpack) {

    return {
        get: function(k) { localStorage.getItem(k); },
        put: function(k, v) { localStorage.setItem(k, v); },
        del: function(k) { localStorage.removeItem(k); }
    };
/*
    var storage = {};

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB

    var prefix = 5050;

    var key = function(k) {
        return prefix.toString()+k;
        return msgpack.pack([prefix, k]);
    };

    var get = function(k) {
        return localStorage.getItem(key(k));
    };

    var put = function(k, v) {
        var kb = key(k);
        try {
            localStorage.setItem(kb, v);
            return true;
        } catch (e) {
            return false;
        }
    };

    var del = function(k) {
        return localStorage.removeItem(key(k));
    };

    if (typeof(get(10)) == 'undefined') {
        put(10, '0');
    }

    var idx_for_key = function(k) {
        var val = get([10, k]);
        if (val) {
            return msgpack.unpack(val);
        }
        var nxt = msgpack.unpack(storage.get(10));
        put(10, msgpack.pack(nxt + 1));
        put([10, k], nxt);
        put([11, nxt], k);
        return nxt;
    };

    var key_for_idx = function(idx) {
        return get([11, idx]);
    };

    var intern_keys = function(v) {
        if (core.isArray(v)) {
            return core.map(v, intern_keys);
        } else if (typeof(v) === 'object') {
            var res = {};
            for (var k in v) {
                if (!v.hasOwnProperty(k)) continue;
                var idx = idx_for_key(k);
                res[idx] = intern_keys(v[k]);
            }
            return res;
        } else {
            return v;
        }
    };

    var unintern_keys = function(v) {
        if (core.isArray(v)) {
            return core.map(v, unintern_keys);
        } else if (typeof(v) === 'object') {
            var res = {};
            for (var idx in v) {
                if (!v.hasOwnProperty(k)) continue;
                res[idx] = unintern_key(idx);
            }
        } else {
            return v;
        }
    };
    
    var pack = function(value) {
        return msgpack.pack(intern_keys(value));
    };

    var unpack = function(blob) {
        return unintern_keys(msgpack.unpack(blob));
    };

    if (indexedDB) {
   
        var db_request = indexedDB.open('_dynajot', '');
        var db = core.future();
        db_request.onsuccess = function(evt) {
            var _db = evt.result;
            if (_db.version === '1') {
                db.fire(_db.createObjectStore('kv'));
            } else {
                _db.setVersion('1').onsuccess = function(evt) {
                    db.fire(_db.createObjectStore('kv'));
                };
            }
        };

        storage.put = function(k, v, fn) {
            db(function(db) {
                try {
                    db.add(v, k);
                    if (fn) fn();
                } catch(e) {
                    if (fn) fn(false);
                }
            });
        };

        storage.get = function(k, fn) {
            db(function(db) {
                try {
                    fn(db.get(k));
                } catch (e) {
                    fn(false);
                }
            });
        };

        storage.del = function(k, fn) {
            db(function(db) {
                try {
                    db.delete(k);
                    if (fn) fn();
                } catch (e) {
                    fn(false);
                }
            });
        };

    } else {
        storage.put = function(k, v, fn) {
            fn(put(k, pack(v)));
        };

        storage.get = function(k, fn) {
            fn(unpack(get(k)));
        };

        storage.del = del;
    }
    
    return storage;*/
});
