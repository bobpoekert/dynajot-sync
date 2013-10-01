define(["core", "socket", "change", "enact"], function(core, socket, change, enact) {

    var sync = {};

    sync.sync = function(node, document_id) {

        var frag = window.location.hash.slice(1).trim();
        if (!document_id && core.truthiness(frag)) {
            document_id = frag;
        }
       
        var url_prefix = 'ws://localhost:5000/doc/';

        var conn = socket.connect(function() {
            if (document_id) {
                return url_prefix+document_id;
            } else {
                return url_prefix;
            }
        });

        var manifold = {
            "document_id": core.pipe(),
            "message": core.pipe()
        };

        conn.onMessage(function (msg) {
            if (manifold[msg.kind]) {
                manifold[msg.kind].write(msg.value);
            }
        });

        manifold.message.addReader(core.partial(enact.applyDelta, node));
        change.changes(node, document_id, conn.send);

        manifold.document_id.addReader(function(message) {
            var prev_id = document_id;
            document_id = message;
            if (typeof(prev_id) === 'function') {
                prev_id(document_id);
            } else {
                window.location.hash = document_id;
            }
        });

    };

    return sync;

});
