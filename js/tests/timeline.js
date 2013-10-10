define(["timeline", "core"], function (timeline, core) {
    module("timeline (js/timeline.js)");

    var instance = timeline.make('testid');
    var locals = instance._locals;

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
        "name": "testtagname",
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

    test("locals.compareDeltas", function () {
        var compareDeltas, d1, d2;
        d1 = getDeltaCopy(delta1);
        d2 = getDeltaCopy(delta2);
        compareDeltas = locals.compareDeltas;

        // d1 d2 differ by global timestamp
        equal(compareDeltas(d1, d1), 0);
        ok(compareDeltas(d1, d2) < 0);
        ok(compareDeltas(d2, d1) > 0);

        d1.message_id[1] = 1;
        d2.message_id[1] = 1;
        d1.message_id[2] = "a";
        d2.message_id[2] = "b";

        // d1 d2 differ by session id
        equal(compareDeltas(d1, d1), 0);
        ok(compareDeltas(d1, d2) < 0);
        ok(compareDeltas(d2, d1) > 0);

        d1.message_id[2] = "deadbeef";
        d2.message_id[2] = "deadbeef";
        d1.message_id[3] = 0;
        d2.message_id[3] = 1;

        // d1 d2 differ by local timestamp
        equal(compareDeltas(d1, d1), 0);
        ok(compareDeltas(d1, d2) < 0);
        ok(compareDeltas(d2, d1) > 0);
    });
    
    test("locals.insertionPoint", function () {
        var sequence, d1, d2, firstDelta, midDelta, lastDelta, lastlastDelta, insertionPoint;
        sequence = locals.sequence;
        insertionPoint = locals.insertionPoint;

        firstDelta = getDeltaCopy(delta1);
        midDelta = getDeltaCopy(delta2);
        lastDelta = getDeltaCopy(delta2);
        lastLastDelta = getDeltaCopy(delta2);

        firstDelta.message_id[1] = 0;
        midDelta.message_id[1] = 1;
        lastDelta.message_id[1] = 2;
        lastLastDelta.message_id[1] = 3;

        equal(insertionPoint(firstDelta), 0);

        sequence.push(firstDelta);
        equal(insertionPoint(lastDelta), sequence.length); // 1

        // more than one thing goes in the middle
        sequence.push(lastDelta);
        equal(insertionPoint(midDelta), 1);

        sequence.push(midDelta);
        equal(insertionPoint(lastLastDelta), sequence.length); // 3
    });
    
    test("locals.mergeDeltas", function () {
        var d1, d2, mergeDeltas, resDelta;
        mergeDeltas = locals.mergeDeltas;
        d1 = getDeltaCopy(delta1);
        d2 = getDeltaCopy(delta2);

        resDelta = mergeDeltas([d1, d2]);
        deepEqual(resDelta, [{
            "id": "deadbeef",
            "name": "testtagname",
            'message_id': [
                document_id,
                1,
                session_id,
                1],
            "attrs": {},
            "position": {},
            "children": []
        }], "merges two deltas with the same node id and no attrs or children");
    

        d1 = {
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
        d2 = {
            "id": "deadbeef",
            "name": "testtagname",
            'message_id': [
                document_id,
                1,
                session_id,
                1],
            "attrs": {},
            "position": {},
            "children": []
        };
        var d3 = {
            "id": "deadbeef2",
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

        resDelta = mergeDeltas([d1, d2, d3]);
        deepEqual(resDelta, [{
            "id": "deadbeef",
            "name": "testtagname",
            'message_id': [
                document_id,
                1,
                session_id,
                1],
            "attrs": {},
            "position": {},
            "children": []
        }, {
            "id": "deadbeef2",
            "name": "testtagname",
            'message_id': [
                document_id,
                0,
                session_id,
                1],
            "attrs": {},
            "position": {},
            "children": []
        }], "merges two deltas with the same node id and no attrs or children");
    });
    
    test("instance.addDelta", function () {
        expect(0);
    });

    test("instance.changeset", function () {
        expect(0);
    });
});