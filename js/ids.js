define([], function() {

    var ids = {};

    var putStorage = function(key, val) {
        var raw_key = 'djc:'+key;
        localStorage.setItem(raw_key, val);
    };

    var getStorage = function(key) {
        return localStorage.getItem('djc:'+key);
    };
    
    var old_sid = getStorage('session_id');
    if (old_sid) {
        ids.session_id = old_sid;
    } else {
        ids.session_id = Math.floor(Math.random() * 10000000000000000).toString();
        putStorage('session_id', ids.session_id);
    }

    ids.session_id += '-' + Math.floor(Math.random() * 1000);

    ids.counter = function(key) {
        var s = getStorage(key);
        var ctr = parseInt(s || 0, 10);
        putStorage(key, (ctr+1).toString());
        return ctr;
    };

    ids.global_timestamp = function(document_id, nextval) {
        // nextval is an optional argument
        // set with nextval, get without it
        //// console.log(nextval);
        var key = 'gs:'+document_id;
        var prevval = parseInt(getStorage(key) || 0, 10);
        if (nextval && nextval > prevval) {
            putStorage(key, nextval.toString());
            return nextval;
        } else {
            return prevval;
        }
    };

    ids.node_ctr = function() {
        var res = ids.counter('node_ctr');
        return res;
    };

    ids.message_ctr = function(document_id) {
        return ids.counter('message_ctr:'+document_id);
    };

    ids.node_id = function(document_id) {
        return [ids.session_id, document_id, ids.node_ctr()].join('-');
    };

    ids.message_id = function(document_id) {
        return [
            document_id,
            ids.global_timestamp(document_id),
            ids.session_id,
            ids.message_ctr(document_id)];
    };

    return ids;

});
