define(["change", "core", "dom", "Data"], function(change, core, dom, data) {
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
            "+": {"height": "768", "width": "1024", "title": "largerEmptyImg"},
            "-": {"alt": false, "src": false, "fooAttr": false}
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
            "-": {"alt": false, "src": false, "fooAttr": false, "title": false}
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

    // test("rootDelta", function () {
    //     var input_state = {
    //         id: 'some_id',
    //         name: 'div',
    //         attrs: {
    //             'id':'mynodeid',
    //             'class':'foo'
    //         },
    //         children: [
    //             {kind: 'text', value: 'some text'},
    //             {kind: 'id', value: 'br_id'},
    //             {kind: 'text', value: 'more text'}
    //         ],
    //         position: {
    //             parent: '_root',
    //             index: 0
    //         }
    //     };

    //     var expected_delta = {
    //         id: 'some_id',
    //         name: 'div',
    //         attrs: {
    //             '+': {
    //                 "id": "mynodeid",
    //                 "class": "foo"
    //             },
    //             '-': {}
    //         },
    //         children: [
    //                 {kind: 'text', value: 'some text'},
    //                 {kind: 'id', value: 'br_id'},
    //                 {kind: 'text', value: 'more text'}],
    //         position: {
    //             parent: '_root',
    //             index: 0
    //         }
    //     };

    //     deepEqual(change.rootDelta(input_state), expected_delta);
    // });

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
            id: 'some_id',
            name: 'div',
            attrs: {
                '+': {
                    "class": "bar"
                },
                '-': {}
            },
            children: [{kind: 'text', value: 'more text'},
                {kind: 'id', value: 'br_id'},
                {kind: 'text', value: 'more text'}]
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


    asyncTest("changes", function () {
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
            id: 'new_id',
            name: 'div',
            attrs: {
                '+': {
                    "width": "1024"
                },
                '-': {}
            },
            "children": [],
            "create": true,
            "position": {
                "index": 0,
                "parent": "_root"
            }
        });

        change_functions.push(function () {
            node.setAttribute("class", "foo");
        });
        expected_deltas.push({
            id: 'new_id',
            name: 'div',
            attrs: {
                '+': {
                    "class": "foo"
                },
                '-': {}
            }
        });

        change_functions.push(function () {
            var child = document.createTextNode("more text");
            node.appendChild(child);
        });
        expected_deltas.push({
            id: 'new_id',
            name: 'div',
            children: [{kind: 'text', value: 'more text'}]
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
    });

});