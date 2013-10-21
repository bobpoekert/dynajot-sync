define(["enact",'change', 'core', 'dom', "tests/action_log", "tests/action_result_html"], function(enact, change, core, dom, action_log, action_result) {
    module("enact (tests/enact.js)");

    test("getNode", function () {
        ok(true);
    });

    var randomChoice = function(lst) {
        return lst[Math.floor(Math.random() * lst.length)];
    };

    var randomString = function() {
        var res = [];
        var cnt = Math.random() * 20;
        for (var i=0; i < cnt; i++) {
            res.push(String.fromCharCode(Math.floor(Math.random() * 26 + 65)));
        }
        return res.join('');
    };

    var randomDict = function() {
        var res = {};
        var cnt = Math.random() * 20;
        for (var i=0; i < cnt; i++) {
            res[randomString().toLowerCase()] = randomString();
        }
        return res;
    };

    var repeatRandom = function(v) {
        var cnt = Math.floor(Math.random() * 20);
        var res = [];
        for (var i=0; i < cnt; i++) {
            res.push(v());
        }
        return res;
    };

    var id_ctr = 0;
    var newNode = function() {
        return {
            id: (id_ctr++).toString(),
            children: repeatRandom(function() {
                return {'kind':'text', 'value':randomString()};
            }),
            name: randomChoice(['div', 'input', 'span', 'button', 'pre', 'label']),
            attrs: randomDict(),
            position: {
                parent: '_root',
                index: id_ctr
            }
        };
    };

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
            var text = randomString();
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
            var node = newNode();
            applier(node);
            var domnode = enact.getNode(root, node.id);
            //ok(domnode);
            //equal(domnode.parentNode, root);
            //deepEqual(change.serializeNode(root, domnode), node);

            var child_node = newNode();
            child_node.position.parent = node.id;
            var actual_index = Math.floor(Math.random() * parent_index++);
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

   var newDomNode = function() {
        var res = document.createElement(randomChoice(['div', 'span', 'label', 'input', 'li', 'pre']));
        for (var i=Math.random() * 10; i > 0; i--) {
            res.setAttribute(randomString().toLowerCase(), randomString());
        }
        for (i=Math.random() * 10; i > 0; i--) {
            res.appendChild(document.createTextNode(randomString()));
        }
        return res;
    };

    test("enact.insertChildNodeAt - stress", function () {
        var root = document.createElement('div');
        root.style.display = 'none';
        document.body.appendChild(root);

        var start_time = Date.now();
        var nodes = [root];
        while (Date.now() - start_time < 500) {
            var node = newDomNode();
            var parent = randomChoice(nodes);
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
            childlist.unshift({kind: 'text', value: randomString()});
            childlist.unshift({kind: 'id', value: new_id});
            var reference_delta = {
                id: '_root',
                name: 'div',
                position: null,
                children: childlist,
                attrs: randomDict()
            };
            var create_delta = {
                id: new_id,
                name: 'strong',
                position: {
                    parent: '_root',
                    index: 0
                },
                attrs: randomDict(),
                children: [{kind: 'text', value: randomString()}]
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