define(["core", "sync", 'change', 'tests/test_utils', 'dom'],
       function(core, sync, change, utils, dom) {
    module("tests/sync.js");


    sync.DEVELOP_MODE = true;
    sync.url_prefix = 'ws://localhost:5000/doc/';

    var connect = function(source_node, document_id, applied_delta, on_connect) {
        var target_node = document.createElement('div');
        var message_ids = [];
        var messages_received = 0;
        sync.sync(source_node, {
            document_id: document_id,
            onChange: function(d) { message_ids.push(d.message_id);},
            onConnect: function() {
                sync.sync(target_node, {
                    document_id: document_id,
                    onConnect: core.partial(on_connect, document_id),
                    onDelta: function(d) {
                        applied_delta(d, message_ids[messages_received++]);
                    }
                });
            }
        });
        return source_node;
    };

    /*var connect = function(source_node, document_id, applied_delta, on_connect) {
        change.changes(source_node, document_id, applied_delta);
        on_connect();
    };*/
    
    asyncTest("changes - replacing node", function() {
        var expected_updates = 10;
        expect(expected_updates * 7);

        var document_id = Math.floor(Math.random() * 1000000).toString();

        var root = document.createElement('div');
        var target = document.createElement('div');
        var prev_target = null;
        root.appendChild(target);

        utils.updateTreeState(root, document_id);
        var finished = false;

        var n_updates = 0;
        var update = function() {
            if (finished) return;
            if (n_updates == expected_updates) {
                finished = true;
                start();
            }
            if (n_updates >= expected_updates) {
                return;
            }
            var newnode = document.createElement('div');
            root.replaceChild(newnode, target);
            prev_target = target;
            target = newnode;
            n_updates++;
        };

        setTimeout(function() {
            if (!finished) {
                finished = true;
                start();
            }
        }, 10000);

        var first = true;
        connect(root, document_id, function(delta, last_message_id) {
            deepEqual(delta.message_id, last_message_id, 'message id is as expected');
            if (first) {
                equal(delta.id, '_root', 'first message is root change');
                equal(delta.children[delta.children.length-1].value,
                     dom.get_node_id(target),
                     'first message contains change in child list');
                first = false;
            } else {
                equal(delta.id, dom.get_node_id(target), 'second message is new node');
                equal(delta.position.parent, '_root', 'new node parent is root');
                equal(delta.position.index, Math.max(0, root.childNodes.length-1),
                     'new node is at end');
                update();
                first = true;
            }
        }, core.once(update));
    });

});
