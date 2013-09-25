define(["storage"], function(storage) {

    var ids = {};

    var old_sid = storage.get('session_id');
    if (old_sid) {
        ids.session_id = old_sid;
    } else {
        ids.session_id = Math.floor(Math.random() * 10000000000000000).toString();
        storage.put('session_id', ids.session_id);
    }

    ids.session_id += '-' + Math.floor(Math.random() * 1000);

    ids.counter = function(key) {
        var ctr = parseInt(localStorage.getItem(key) || 0, 10);
        localStorage.setItem(key, (ctr+1));
        return ctr;
    };

    ids.global_timestamp = function(document_id, nextval) {
        var key = 'gs_'+document_id;
        var prevval = parseInt(storage.get(key) || 0, 10);
        if (nextval && nextval > prevval) {
            storage.put(key, nextval.toString());
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
        return ids.counter('message_ctr_'+document_id);
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
