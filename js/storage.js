define([], function() {

    var storage = {};

    storage.prefix = '__dyn_';

    storage.get = function(k) {
        return localStorage.getItem(storage.prefix+k);
    };

    storage.put = function(k, v) {
        return localStorage.setItem(storage.prefix+k, v);
    };

    storage.del = function(k) {
        return localStorage.removeItem(storage.prefix+k);
    };

    return storage;

});
