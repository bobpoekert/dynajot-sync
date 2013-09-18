define(["core", "msgpack"], function(core, msgpack) {

    var prefix = 5050;

    var key = function(k) {
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
    
    if (typeof(storage.get(10)) == 'undefined') {
        storage.put(10, '0');
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
    
    storage.put = function(k, v, fn) {
        fn(put(k, pack(v)));
    };

    storage.get = function(k, fn) {
        fn(unpack(get(k)));
    };

    storage.del = del;

    return storage;
});
