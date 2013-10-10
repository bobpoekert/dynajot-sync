define(["change", "core"], function(change, core) {
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
            "start": 3,
            "end": 4,
            "value": [{
                'kind': 'id',
                'value': 'brat'
            }, {
                'kind': 'text',
                'value': 'brattext'
            }]
        }];
        b.children = [{
            "start": 0,
            "end": 2,
            "value": [{
                'kind': 'id',
                'value': 'brat'
            }, {
                'kind': 'text',
                'value': 'brattext'
            }]
        }];

        mergeDeltas(a, b);
        expectedChildren = [
        {
            "start": 3,
            "end": 4,
            "value": [{
                'kind': 'id',
                'value': 'brat'
            }, {
                'kind': 'text',
                'value': 'brattext'
            }]
        },
        {
            "start": 0,
            "end": 2,
            "value": [{
                'kind': 'id',
                'value': 'brat'
            }, {
                'kind': 'text',
                'value': 'brattext'
            }]
        }];

        deepEqual(a.children, expectedChildren, "no overlap for children");

    });
});