define(["storage"], function(storage) {

    var ids = {};

    var old_sid = storage.get('session_id');
    if (old_sid) {
        ids.session_id = old_sid;
    } else {
        ids.session_id = Math.random().toString();
        storage.put('session_id', ids.session_id);
    }

    ids.node_ctr = function() {
        var ctr = parseInt(storage.get('node_ctr') || 0);
        storage.put('node_ctr', ctr+1);
        return ctr;
    };

    ids.node_id = function(document_id) {
        if (typeof(document_id) == 'undefined') {
            console.trace();
        }
        return [ids.session_id, document_id, ids.node_ctr()].join('-');
    };

    return ids;

});
