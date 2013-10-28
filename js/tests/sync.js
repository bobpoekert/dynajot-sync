define(["core", "sync", 'change', 'tests/test_utils', 'dom'],
       function(core, sync, change, utils, dom) {
    module("tests/sync.js");


    sync.DEVELOP_MODE = true;
    sync.url_prefix = 'ws://localhost:5000/doc/';

    var connect = function(source_node, applied_delta, on_connect) {
        var target_node = document.createElement('div');
        sync.sync(source_node, {
            onDocumentId: function(id) {
                sync.sync(target_node, {
                    document_id: id,
                    onConnect: core.partial(on_connect, id),
                    onDelta: applied_delta
                });
            }
        });
        return source_node;
    };
    
    asyncTest("changes - replacing node", function() {
        var expected_updates = 100;
        expect(expected_updates * 5);

        var root = utils.randomElement();
        var target = document.createElement('div');
        var prev_target = null;
        root.appendChild(target);

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
        }, 2000);

        var first = true;
        connect(root, function(delta) {
            if (first) {
                equal(delta.id, '_root');
                equal(delta.children[delta.children.length-1].value,
                     dom.get_node_id(target));
                first = false;
            } else {
                equal(delta.id, dom.get_node_id(target));
                equal(delta.position.parent, '_root');
                equal(delta.position.index, root.childNodes.length-1);
                update();
                first = true;
            }
        }, function(id) {
            utils.updateTreeState(root, id);
            update();
        });

    });

});
