define(["change", "core", "dom", "Data", "tests/test_utils"], function(change, core, dom, data, utils) {
    module("change (js/change.js)");

    var delta1, delta2, document_id, session_id;
    document_id = "deadbeef";
    session_id = "testsession";
    delta1 = {
        "id": "deadbeef",
        "name": "testtagname",
        'message_id': [
            document_id,
            0,
            session_id,
            1],
        "attrs": {},
        "position": {},
        "children": []
    };
    delta2 = {
        "id": "deadbeef",
        "name": "testtagname2",
        'message_id': [
            document_id,
            1,
            session_id,
            1],
        "attrs": {},
        "position": {},
        "children": []
    };

    var getDeltaCopy = function(delta) {
        return {
            id: delta.id,
            name: delta.name,
            message_id: delta.message_id.slice(),
            attrs: core.inherit(delta.attrs),
            position: core.inherit(delta.position),
            children: delta.children.slice()
        };
    };

    var updateTreeState = function(root) {
        dom.traverse(root, function(node) {
            change.updateState(root, node, 'document_id');
        });
    };

    asyncTest("changes - adding child nodes", function() {
        expect(6);
        var root = utils.randomElement();
        root.appendChild(utils.randomElement());

        updateTreeState(root);

        var new_node = document.createElement('div');
        new_node.setAttribute('foo', 'bar');
        dom.set_node_id(new_node, 'test');
        var change_count = 0;
        change.changes(root, 'document_id', function(delta) {
            switch(change_count) {
                case 0:
                    deepEqual(delta.children[0], {'kind':'id', 'value':'test'});
                    break;
                case 1:
                    equal('test', delta.id);
                    deepEqual({
                        parent: '_root',
                        index: 0
                    }, delta.position);
                    equal('div', delta.name);
                    deepEqual([], delta.children);
                    break;
                case 2:
                    deepEqual({
                        parent: '_root',
                        index: 1
                    }, delta.position);
                    start();
                    break;
                default:
                    if (change_count > root.children.length) {
                        console.log(delta);
                    }
            }
            change_count++;
        });

        setTimeout(function() {
            if (change_count < 3) {
                start();
            }
        }, 1000);

        root.insertBefore(new_node, root.firstChild);

    });

    var moveChildListTest =  function() {

        var root = utils.randomElement();
        root.appendChild(utils.randomElement());
        var child = utils.randomElement();
        var child_id = dom.assign_node_id(root, child, 'document_id');
        root.appendChild(child);
        expect(4 + root.children.length - 1);

        updateTreeState(root);

        var change_count = 0;
        var finished = false;
        var watcher = change.changes(root, 'document_id', function(delta) {
            switch(change_count) {
                case 0:
                    equal(delta.id, '_root', 'first delta is root');
                    deepEqual(delta.children[0], {'kind':'id', 'value':child_id}, 'root has correct first child');
                    break;
                case 1:
                    equal(delta.id, child_id, 'second delta is target');
                    deepEqual(delta.position, {parent: '_root', index: 0}, 'target has correct position');
                    break;
                default:
                    if (change_count <= root.children.length + 1) {
                        equal(change_count - 1, delta.position.index, 'siblings of target are shifted over by one');
                    }
                    if (change_count == root.children.length + 1 && !finished) {
                        start();
                        finished = true;
                        return false;
                    }
            }
            change_count++;
        });
       
        root.removeChild(child);
        dom.insertNodeAt(root, child, 0);

        setTimeout(function() {
            if (!finished) {
                start();
                finished = true;
                watcher.stop();
            }
        }, 1000);

    };
    asyncTest("changes - moving nodes in child list", moveChildListTest);

    asyncTest("changes - replacing node", function() {
        var expected_updates = 100;
        expect(expected_updates * 5);

        var root = utils.randomElement();
        var target = document.createElement('div');
        var prev_target = null;
        root.appendChild(target);

        updateTreeState(root);
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

        var first = true;
        change.changes(root, 'document_id', function(delta) {
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
        });

        update();

    });

    test("serializeNode", function () {
        var node, root, serializeNode, document_id;
        serializeNode = change.serializeNode;
        root = document.createElement("div");
        document_id = "testid";

        deepEqual(serializeNode(root, node, document_id), {}, "returns {} if no node");

        node = document.createElement("div");

        deepEqual(serializeNode(root, node, document_id), {}, "returns {} if node has no parent");

        root.appendChild(node);
        var br =document.createElement('br');
        dom.set_node_id(br, 'br_id');
        dom.set_node_id(node, 'some_id');
        node.setAttribute("id", "mynodeid");
        node.setAttribute("class", 'foo');
        node.appendChild(document.createTextNode('some text'));
        node.appendChild(br);
        node.appendChild(document.createTextNode('more text'));

        var expected_result = {
            id: 'some_id',
            name: 'div',
            attrs: {
                'id':'mynodeid',
                'class':'foo'
            },
            children: [
                {kind: 'text', value: 'some text'},
                {kind: 'id', value: 'br_id'},
                {kind: 'text', value: 'more text'}
            ],
            position: {
                parent: '_root',
                index: 0
            }
        };

        deepEqual(serializeNode(root, node, document_id), expected_result);
    });

    test("updateState", function () {
        var root, node;
        root = document.createElement("div");
        node = document.createElement("div");

        root.appendChild(node);
        node.setAttribute("data-id", "mytestid");
        var br =document.createElement('br');
        dom.set_node_id(br, 'br_id');
        node.setAttribute("id", "mynodeid");
        node.setAttribute("class", 'foo');
        node.appendChild(document.createTextNode('some text'));
        node.appendChild(br);
        node.appendChild(document.createTextNode('more text'));

       var expected_result = {
            id: 'mytestid',
            name: 'div',
            attrs: {
                'id':'mynodeid',
                'class':'foo'
            },
            children: [
                {kind: 'text', value: 'some text'},
                {kind: 'id', value: 'br_id'},
                {kind: 'text', value: 'more text'}
            ],
            position: {
                parent: '_root',
                index: 0
            }
        };

        var returned_state = change.updateState(root, node);

        deepEqual(returned_state, expected_result);
        deepEqual(data.get(node, 'state'), expected_result);
        ok(!node.hasAttribute('data-id'));
    });

    test("mergeDeltas", function () {
        var a, b, mergeDeltas, expectedChildren;
        mergeDeltas = change.mergeDeltas;
        a = getDeltaCopy(delta1);
        b = getDeltaCopy(delta2); // b is immutable

        // name should not change
        var nameBefore = a.name;
        mergeDeltas(a, b);
        equal(nameBefore, a.name);

        a = getDeltaCopy(delta1);
        b = getDeltaCopy(delta2); // b is immutable



        // attributes
        a.attrs = {
            "+": {"width": "800", "title": "largerEmptyImg"},
            "-": {"alt": false, "src": false}
        };
        b.attrs = {
            "+": {"height": "768", "width": "1024"},
            "-": {"fooAttr": false}
        };

        mergeDeltas(a, b);
        deepEqual(a.attrs, {
          "+": {
            "height": "768",
            "width": "1024"
          },
          "-": {
            "fooAttr": false
          }
        }, "attrs from a[+] and a[-] get overwritten and added by b");


        a = getDeltaCopy(delta1);
        b = getDeltaCopy(delta2); // b is immutable

        a.attrs = {
            "+": {"width": "800", "title": "largerEmptyImg"},
            "-": {"alt": false, "src": false}
        };
        b.attrs = {
            "+": {"height": "768", "width": "1024"},
            "-": {"fooAttr": false, "title": false}
        };

        mergeDeltas(a, b);
        deepEqual(a.attrs, {
            "+": {"height": "768", "width": "1024"},
            "-": {"fooAttr": false, "title": false}
        }, "attrs removed by b are removed from a[+] and added to b[-]");


        // position
        a = getDeltaCopy(delta1);
        b = getDeltaCopy(delta2); // b is immutable
        a.position = {};
        b.position = {
            "parent": "someStringIDofDomNode",
            "index": 1
        };
        mergeDeltas(a, b);
        deepEqual(a.position, b.position, "a takes b's position if b has a position");

        
        // children
        a = getDeltaCopy(delta1);
        b = getDeltaCopy(delta2); // b is immutable
        a.children = [];
        b.children = [{
            "start": 2,
            "end": 4,
            "value": [{
                'kind': 'id',
                'value': 'brat'
            }, {
                'kind': 'text',
                'value': 'brattext'
            }]
        }];

        mergeDeltas(a, b);
        deepEqual(a.children, b.children, "a takes b's children if a has no children");

        a = getDeltaCopy(delta1);
        b = getDeltaCopy(delta2); // b is immutable
        a.children = [{
            'kind': 'id',
            'value': 'brat'
        }, {
            'kind': 'text',
            'value': 'brattext'
        }];
        b.children = [{
            'kind': 'id',
            'value': 'brat'
        }, {
            'kind': 'text',
            'value': 'brattext'
        }];

        mergeDeltas(a, b);
        expectedChildren = [{
            'kind': 'id',
            'value': 'brat'
            }, {
            'kind': 'text',
            'value': 'brattext'
        },
        {
            'kind': 'id',
            'value': 'brat'
            }, {
            'kind': 'text',
            'value': 'brattext'
        }];

        deepEqual(a.children, expectedChildren, "no overlap for children");

    });

    // sentence diff not used
    // patch not used

    test("delta", function () {
        var before_state = {
            id: 'some_id',
            name: 'div',
            attrs: {
                'id':'mynodeid',
                'class':'foo'
            },
            children: [
                {kind: 'text', value: 'some text'},
                {kind: 'id', value: 'br_id'},
                {kind: 'text', value: 'more text'}
            ],
            position: {
                parent: '_root',
                index: 0
            }
        };

        var after_state = {
            id: 'some_id',
            name: 'div',
            attrs: {
                'id':'mynodeid',
                'class':'bar'
            },
            children: [
                {kind: 'text', value: 'more text'},
                {kind: 'id', value: 'br_id'},
                {kind: 'text', value: 'more text'}
            ],
            position: {
                parent: '_root',
                index: 0
            }
        };

        var expected_delta = {
          "attrs": {
            "class": "bar",
            "id": "mynodeid"
          },
          "children": [
            {
              "kind": "text",
              "value": "more text"
            },
            {
              "kind": "id",
              "value": "br_id"
            },
            {
              "kind": "text",
              "value": "more text"
            }
          ],
          "id": "some_id",
          "name": "div",
          "position": {
            "index": 0,
            "parent": "_root"
          },
          "removed_attrs": {},
          "removed_children": [
            {
              "kind": "text",
              "value": "some text"
            }
          ]
        };

        deepEqual(change.delta(before_state, after_state), expected_delta);
    });

    test("nodeTransaction", function () {
        var node = document.createElement("div");
        var root = document.createElement("div");
        root.appendChild(node);
        change.nodeTransaction(root, node, function () {
            equal(data.get(node, 'dirty'), true);
        });
        ok(!data.get(node, 'dirty'));
    });

    test("nodeTransactions", function () {
        var node = document.createElement("div");
        var root = document.createElement("div");
        root.appendChild(node);
        change.nodeTransactions(root, [node], function () {
            equal(data.get(node, 'dirty'), true);
        });
        ok(!data.get(node, 'dirty'));
    });

    /*asyncTest("changes", function () {
        var expected_deltas = [];

        var root = document.createElement("div");
        var node = document.createElement("div");
        root.appendChild(node);
        var change_functions = [];
        var changes_applied = 0;
        dom.set_node_id(node, "new_id");

        change_functions.push(function () {
            node.setAttribute("width", "1024");
        });
        expected_deltas.push({
          "attrs": {
            "width": "1024"
          },
          "children": [],
          "id": "new_id",
          "name": "div",
          "position": {
            "index": 0,
            "parent": "_root"
          }
        });

        change_functions.push(function () {
            node.setAttribute("class", "foo");
        });
        expected_deltas.push({
          "attrs": {
            "class": "foo",
            "width": "1024"
          },
          "children": [],
          "id": "new_id",
          "name": "div",
          "position": {
            "index": 0,
            "parent": "_root"
          },
          "removed_attrs": {},
          "removed_children": []
        });

        change_functions.push(function () {
            var child = document.createTextNode("more text");
            node.appendChild(child);
        });
        expected_deltas.push({
            'attrs': {},
            'children': [
                {'kind':'id', 'value':'new_id'}],
            'id':'_root',
            'name':'div',
            'position':null
        });
        expected_deltas.push({
          "attrs": {
            "class": "foo",
            "width": "1024"
          },
          "children": [
            {
              "kind": "text",
              "value": "more text"
            }
          ],
          "id": "new_id",
          "name": "div",
          "position": {
            "index": 0,
            "parent": "_root"
          },
          "removed_attrs": {},
          "removed_children": []
        });

        var interval = setInterval(function() {
            change_functions[changes_applied]();
            changes_applied++;
            if (changes_applied >= change_functions.length) {
                clearInterval(interval);
            }
        }, 200);

        var changes_happened = 0;
        change.changes(root, document_id, function (delta) {
            var expect = expected_deltas[changes_happened];
            deepEqual(delta, expect);
            changes_happened++;
            if (changes_happened >= expected_deltas.length) {
                start();
            }
        });

        expect(expected_deltas.length);
    });*/

});
