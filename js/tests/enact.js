define(["enact", 'change', 'core', 'dom', "tests/action_log", "tests/action_result_html", 'tests/test_utils'], function(enact, change, core, dom, action_log, action_result, utils) {
    module("enact (tests/enact.js)");

    test("getNode", function () {
        ok(true);
    });

    test("duplication", function() {
        var textDelta = function(text) {
            return {
                id: 'container',
                children: [{'kind':'text', 'value':text}],
                attrs: {},
                position: {
                    parent: 'second',
                    index: 0
                }
            };
        };
        var root = document.createElement('div');
        var second = document.createElement('div');
        var container = document.createElement('strong');
        dom.set_node_id(container, 'container');
        dom.set_node_id(second, 'second');
        root.appendChild(second);
        second.appendChild(container);

        var applier = enact.appliesDeltas(root);

        var start_time = Date.now();
        while (Date.now() - start_time < 1000) {
            var text = utils.randomString();
            second.innerHTML = second.innerHTML.replace(new RegExp('\<strong(.*?)\>.*?\</strong\>', 'g'), '<strong>'+text+'</strong>');
            //second.innerHTML = '<strong>'+text+'</strong>';
            var cont = change.serializeNode(root, second.firstChild);
            var ser_second = change.serializeNode(root, second);
            equal(ser_second.children[0].value, cont.id);
            equal(cont.children[0].value, text);
            equal(cont.position.parent, ser_second.id);
            equal(cont.position.index, 0);
            equal(second.firstChild.innerHTML, text);
            equal(second.childNodes.length, 1);
        }
    });

    test("race", function() {
        var root = document.createElement('div');
        root.style.display = 'none';
        document.body.appendChild(root);

        var applier = enact.appliesDeltas(root);
        var start_time = Date.now();

        var parent_index = 0;
        while (Date.now() - start_time < 5) {
            var node = utils.newNode();
            applier(node);
            var domnode = enact.getNode(root, node.id);
            //ok(domnode);
            //equal(domnode.parentNode, root);
            //deepEqual(change.serializeNode(root, domnode), node);

            var child_node = utils.newNode();
            child_node.position.parent = node.id;
            var actual_index = Math.floor(Math.random() * parent_index);
            child_node.position.index = actual_index;
            applier(child_node);
            var dom_child = enact.getNode(root, child_node.id);
            //ok(dom_child);
            //equal(dom_child.parentNode, domnode);
            //equal(dom.get_node_id(dom_child.parentNode), child_node.position.parent);
            equal(dom.nodeParentIndex(dom_child)[1], child_node.position.index);
            //deepEqual(change.serializeNode(root, dom_child), child_node);
        }
    });

    test("enact.insertChildNodeAt - stress", function () {
        var root = document.createElement('div');
        root.style.display = 'none';
        document.body.appendChild(root);

        var start_time = Date.now();
        var nodes = [root];
        while (Date.now() - start_time < 500) {
            var node = utils.newDomNode();
            var parent = utils.randomChoice(nodes);
            var idx = Math.floor(Math.random() * dom.getChildNodes(parent).length);
            enact.insertChildNodeAt(parent, node, idx);
            equal(dom.nodeParentIndex(node)[1], idx);
            nodes.push(node);
        }
    });

    var deltas = core.map(action_log, core.gattr('value'));
  
    var harness = function (fn) {
        var root = document.createElement("div");
        var applier = enact.appliesDeltas(root);
        return fn(root, applier);
    };

    asyncTest("appliesDeltas", function () {
        expect(100);
        var root = document.createElement('div');
        root.style.display = 'none';
        document.body.appendChild(root);

        var applier = enact.appliesDeltas(root);
        var id_ctr = 0;
        var childlist = [];
        var looper = function() {
            var new_id = (id_ctr++).toString();
            childlist.unshift({kind: 'text', value: utils.randomString()});
            childlist.unshift({kind: 'id', value: new_id});
            var reference_delta = {
                id: '_root',
                name: 'div',
                position: null,
                children: childlist,
                attrs: utils.randomDict()
            };
            var create_delta = {
                id: new_id,
                name: 'strong',
                position: {
                    parent: '_root',
                    index: 0
                },
                attrs: utils.randomDict(),
                children: [{kind: 'text', value: utils.randomString()}]
            };
            applier(reference_delta);
            
            setTimeout(function() {
                applier(create_delta);
                equal(dom.get_node_id(root.firstChild), new_id);
                if (id_ctr < 100) {
                    setTimeout(looper, 100);
                } else {
                    start();
                }
            }, 100);
        };
        looper();
    });
});
