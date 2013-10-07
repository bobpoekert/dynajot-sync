define(["core", "socket", "change", "enact", "dom", "timeline"], function(core, socket, change, enact, dom, timeline) {

    var sync = {};

    sync.sync = function(node, document_id) {

        var frag = window.location.hash.slice(1).trim();
        if (!document_id && core.truthiness(frag)) {
            document_id = frag;
        }
       
        var url_prefix = 'ws://localhost:5000/doc/';
        var document_timeline;

        var conn = socket.connect(function() {
            if (document_id) {
                return url_prefix+document_id;
            } else {
                return url_prefix;
            }
        });

        var manifold = {
            "document_id": core.pipe(),
            "document_state": core.pipe(),
            "message": core.pipe()
        };

        conn.onMessage(function (msg) {
            if (manifold[msg.kind]) {
                manifold[msg.kind].write(msg.value);
            }
        });

        manifold.document_id.addReader(function(message) {
            var prev_id = document_id;
            document_id = message;
            if (typeof(prev_id) === 'function') {
                prev_id(document_id);
            } else {
                window.location.hash = document_id;
            }
        });

        manifold.document_state.addReader(core.once(function(message) {
            document_timeline = timeline.make(document_id);
            if (message) {
                node.innerHTML = '';
            } else {
                dom.traverse(node, function(c) {
                    if (dom.isTextNode(c)) return;
                    var ser = change.serializeNode(node, c);
                    var state = change.rootDelta(ser);
                    document_timeline.addDelta(state);
                    conn.send(state);
                });
            }
            var applier = enact.appliesDeltas(node);
            manifold.message.addReader(function(message) {
                var changeset = document_timeline.changeset(message);
                core.each(changeset, applier);
            });
            change.changes(node, document_id, function(delta) {
                document_timeline.addDelta(delta);
                conn.send(delta);
            });
        }));
    };

    return sync;

});
