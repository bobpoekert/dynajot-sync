define([
    "core", "socket", "change", "enact", "dom",
    "timeline", "cursors", "ids", "Data"], function(
        core, socket, change, enact, dom,
        timeline, cursors, ids, data) {

    var sync = {};

    sync.DEVELOP_MODE = false;
    if (/localhost/.test(window.location.href)) {
        sync.DEVELOP_MODE = true;
    }

    sync.sync = function(node, options) {
        options = core.errorizeParams(options || {});

        var document_id = options.document_id;
        var id_callback = options.onDocumentId;

        var frag = window.location.hash.slice(1).trim();
        if (!document_id && core.truthiness(frag)) {
            document_id = frag;
        }
     
        var url_prefix;
        if (sync.url_prefix) {
            url_prefix = sync.url_prefix;
        } else {
            url_prefix = 'ws://ec2-184-169-204-24.us-west-1.compute.amazonaws.com:5000/doc/';
            if (sync.DEVELOP_MODE) {
                url_prefix = 'ws://'+window.location.host+'/doc/';
            }
        }
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
            "message": core.pipe(),
            "response": core.pipe()
        };

        var request_counter = 0;
        var request_callbacks = {};
        var request = function(resource, callback) {
            var request_id = request_counter;
            request_counter++;
            request_callbacks[request_id] = callback;
            conn.send({
                'kind': 'request',
                'value': {
                    'resource': resource,
                    'id': request_id
                }
            });
        };

        outer_manifold.response.addReader(function(response) {
            // console.log(response);
            var id = response.id;
            var value = response.value;
            request_callbacks[id](value);
            delete request_callbacks[id];
        });

        var getNodeFromServer = function(node_id, callback) {
            request('/nodes/'+node_id, function(response) {
                if (response.kind == 'error' && response.value == 404) {
                    setTimeout(core.partial(getNodeFromServer, node_id, callback), 500);
                } else {
                    callback(response);
                }
            });
        };

        var inner_manifold = {
            "delta": core.pipe(),
            "mouse_position": core.pipe()
        };

        var connect_manifold = function (manifold) {
            return function (msg) {
                console.log(JSON.stringify(msg));
                if (manifold[msg.kind]) {
                    manifold[msg.kind].write(msg.value);
                }
            };
        };

        conn.onMessage(connect_manifold(outer_manifold));

        outer_manifold.message.addReader(connect_manifold(inner_manifold));

        outer_manifold.message.addReader(function(message) {
            if (message.global_timestamp) {
                ids.global_timestamp(document_id, message.global_timestamp);
            }
        });

        outer_manifold.document_id.addReader(function(message) {
            var prev_id = document_id;
            document_id = message;
            if (message.global_timestamp) {
                ids.global_timestamp(document_id, message.global_timestamp);
            }
            if (typeof(id_callback) === 'function') {
                id_callback(document_id);
            } else {
                window.location.hash = document_id;
            }
        });

        if (options.cursors) {
            cursors.init(conn.send);
            inner_manifold.mouse_position.addReader(cursors.updateCursors);
        }

        // problem: Not sending child list changes over the wire?

        outer_manifold.document_state.addReader(core.once(function(message) {
            document_timeline = timeline.make(document_id);
            if (message) {
                var target = document.createElement('div');
                target.innerHTML = message;
                var new_root = target.firstChild;
                dom.removeAllChildren(node);
                while(true) {
                    var new_node = new_root.firstChild;
                    if (!new_node) break;
                    new_root.removeChild(new_node);
                    node.appendChild(new_node);
                }
                dom.removeAllAttributes(node);
                dom.iterAttributes(new_root, function(k, v) {
                    node.setAttribute(k, v);
                });
                dom.traverse(node, function(new_node) {
                    var attr = new_node.getAttribute('data-dynajot-id');
                    if (!attr) return;
                    dom.set_node_id(new_node, attr);
                    new_node.removeAttribute('data-dynajot-id');
                    change.updateState(node, new_node, document_id);
                    data.set(new_node, 'seen', true);
                });
            } else {
                // document does not exist; upload current browser state
                dom.traverse(node, function(c) {
                    if (dom.isTextNode(c)) return;
                    var ser = change.serializeNode(node, c, document_id);
                    document_timeline.addDelta(ser);
                    conn.send({'kind':'delta', 'value': ser});
                });
            }

            dom.traverse(node, function(child) {
                change.updateState(node, child, document_id);
            });

            var seen_message_ids = {};

            var serializeMessageId = function(message_id) {
                return core.map(message_id, function(e) {
                    var er;
                    try {
                        return e.toString();
                    } catch(er) {
                        console.log(e);
                    }
                }).join('-');
            };

            var applier = enact.appliesDeltas(node, document_id, getNodeFromServer);
            inner_manifold.delta.addReader(function(message) {
                var id_string = serializeMessageId(message.message_id);
                if (seen_message_ids[id_string]) {
                    return;
                }
                seen_message_ids[id_string] = true;
                var changeset = document_timeline.changeset(message);
                core.each(changeset, applier);
                if (options.onDelta) {
                    core.each(changeset, options.onDelta);
                }
            });

            change.changes(node, document_id, function(delta) {
                // console.log('delta', delta);
                if (core.isEmpty(delta)) return;
                delta = core.clone(delta);
                delta.message_id = ids.message_id(document_id);
                seen_message_ids[serializeMessageId(delta.message_id)] = true;
                document_timeline.addDelta(delta);
                if (options.onChange) {
                    options.onChange(delta);
                }
                conn.send({'kind':'delta', 'value':delta});
            });

            if (typeof(options.onConnect) == 'function') options.onConnect();
        }));
    };

    return sync;

});
