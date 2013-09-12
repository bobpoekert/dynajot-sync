define(["core"], function(core) {

    var storage = {};
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
        
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

    var db_future = function(db_request, event_processor) {
        var res = core.future();
        if (db_request.readyState === 'pending') {
            db_request.onsuccess = function(evt) {
                if (typeof(event_processor) === 'function') {
                    event_processor(evt.result, res.fire);
                } else {
                    res.fire(evt.result);
                }
            };
            db_request.onerror = function(evt) {
                res.fire(false);
            };
            db_request.onupgradeneeded = function(evt) {
                res.fire('upgrade', evt.target.result);
            };
        } else {
            if (db_request.error === 'NoError') {
                res.fire(db_request.result);
            } else {
                res.fire(false);
            }
        }
        return res;
    };

    var db = db_future(indexedDB.open('_dynajot', 1), function(_db, cb) {
        if (_db.version === '1') {
            cb(_db.createObjectStore('seq'));
        } else {
            db_future(_db.setVersion('1'))(function(evt) {
                cb(_db.createObjectStore('seq'));
            });
        }
    });

    var takes_db = function(fn) {
        return function() {
            var self = this;
            var args = core.toArray(arguments);
            db(function(_db) {
                args.unshift(_db);
                fn.apply(self, args);
            });
        };
    };

    storage.get = takes_db(function(db, key) {

    });

    var sequence = {};
    storage.sequence = sequence;
    sequence.create = function(sort_key) {
        var seq = {};

        var key = function(k) {
            return [sort_key, k];
        };

        var iter = takes_db(function(db, n, cb) {
            var cursor = db_future(db.openCursor());
            cursor(function(cursor) {
                var e;
                while(true) {
                    if (cb(cursor.key, db.get(key(cursor.key))) === false) break;
                    try {
                        cursor.advance();
                    } catch(e) {
                        break;
                    }
                }
            });
        });

        var n_oldest = function(n, cb) {
            var res = [];
            iter(function(k, v) {
                res.push([k, v]);
                if (res.length >= n) {
                    cb(res);
                    return false;
                }
            });
        };

        var drop = takes_db(function(db, keys) {
            for (var i=0; i < keys.length; i++) {
                db.delete(key(keys[i]));
            }
        });

        var compact = takes_db(function(db, cb) {
            n_oldest(1000, function(pairs) {
                var groups = core.groupBy(pairs, core.splat(function(k, v) {
                   return v.node_id;
                }));
                for (var i=0; i < groups.length; i++) {
                    var group = groups[i];
                    var keeper = core.max(group, function(v) {
                        return v.id;
                    });
                    for (var j=0; j < group.length; j++) {
                        var e = group[j];
                        if (e.id != keeper.id) {
                            db.delete(key(e.id));
                        }
                    }
                }
                cb();
            });
        });

        seq.add = takes_db(function(db, edit, cb) {
            var e;
            try {
                var res = db.add(edit, key(edit.id));
                if (cb) cb(db_future(res));
            } catch(e) {
                compact(core.partial(seq.add, edit, cb));
            }
        });

        seq.iter = iter;

        seq.after = function(id, cb) {
            var res = [];
            iter(function(row) {
                if (row.id > id) {
                    cb(res);
                    return false;
                }
                res.push(row);
            });
        };

        return seq;
    };

    return storage;
});
