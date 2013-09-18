define(["core"], function(core) {

    var storage = {};
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB

    if (!indexedDB) return false;

    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

    /* 
    *   ["keyval", []]
    *   ["log-1", [["node-id", "node-id", {unique: false}]]]
    */

    var applySchema = function(db, schema) {
        var store_name = schema[0];
        var indexes = schema[1];
        var store = db.createObjectStore(store_name);
        for (var j=0; j < indexes.length; j++) {
            var index = indexes[j];
            store.createIndex(index[0], index[1], index[2]);
        }
    };

    var createDatabase = function(dbname, dbversion, schemas, callback) {
        var req = indexedDB.open(dbname, dbversion);
        req.onblocked = function(evt) {
            callback(false, 'blocked');
        };
        req.onerror = function(evt) {
            callback(false, evt);
        };
        req.onupgradeneeded = function(evt) {
            var db = evt.target.result;
            for (var i=0; i < schemas.length; i++) {
                var schema = schemas[i];
                applySchema(db, schema);
            }
        };
        req.onsuccess = function(evt) {
            callback();
        };
    };

    var createStore = function(store_name, 

    return storage;
});
