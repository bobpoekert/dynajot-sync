define(["core", "socket", "change", "enact"], function(core, socket, change, enact) {

    var sync = {};

    sync.sync = function(node, document_id) {

        var frag = window.location.hash.slice(1).trim();
        if (!document_id && frag) {
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

        var setup = function() {
            var from_network = core.pipe();
            conn.onMessage(from_network.write);
            from_network.addReader(core.partial(enact.applyDelta, node));
            change.changes(node, document_id, conn.send);
        };

        if (typeof(document_id) === 'string') {
            setup();
        } else {
            var idx;
            idx = conn.onMessage(function(message) {
                var prev_id = document_id;
                document_id = message.document_id;
                conn.removeMessageCallback(idx);
                if (typeof(prev_id) === 'function') {
                    prev_id(document_id);
                } else {
                    window.location.hash = document_id;
                }
                setup();
            });
        }

    };

    return sync;

});
