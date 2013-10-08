define(["core", "socket", "change", "enact", "dom", "timeline", "cursors"], function(core, socket, change, enact, dom, timeline, cursors) {

    var sync = {};

    sync.sync = function(node, options) {
        options || (options = {});
        var document_id = options.document_id;

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

        var outer_manifold = {
            "document_id": core.pipe(),
            "document_state": core.pipe(),
            "message": core.pipe()
        };

        var inner_manifold = {
            "delta": core.pipe(),
            "mouse_position": core.pipe()
        };

        var connect_manifold = function (manifold) {
            return function (msg) {
                if (manifold[msg.kind]) {
                    manifold[msg.kind].write(msg.value);
                }
            };
        };

        conn.onMessage(connect_manifold(outer_manifold));

        outer_manifold.message.addReader(connect_manifold(inner_manifold));

        outer_manifold.document_id.addReader(function(message) {
            var prev_id = document_id;
            document_id = message;
            if (typeof(prev_id) === 'function') {
                prev_id(document_id);
            } else {
                window.location.hash = document_id;
            }
        });

        if (options.cursors) {
            console.log("added Reader");
            cursors.init(conn.send);
            inner_manifold.mouse_position.addReader(cursors.updateCursors);
        }

        outer_manifold.document_state.addReader(core.once(function(message) {
            document_timeline = timeline.make(document_id);
            if (message) {
                var frag = document.createElement('div');
                node.innerHTML = message;
                dom.traverse(node, function(child) {
                    change.updateState(node, child);
                });
            } else {
                dom.traverse(node, function(c) {
                    if (dom.isTextNode(c)) return;
                    var ser = change.serializeNode(node, c);
                    var state = change.rootDelta(ser);
                    document_timeline.addDelta(state);
                    conn.send({'kind':'delta', 'value': state});
                });
            }
            var applier = enact.appliesDeltas(node);
            inner_manifold.delta.addReader(function(message) {
                var changeset = document_timeline.changeset(message);
                core.each(changeset, applier);
            });

            change.changes(node, document_id, function(delta) {
                document_timeline.addDelta(delta);
                conn.send({'kind':'delta', 'value':delta});
            });
        }));
    };

    return sync;

});
