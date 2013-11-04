define(["ids", "core", "change"], function(ids, core, change) {

    var timeline = {};


    timeline.make = function(document_id) {

        var sequence = [];
        var last_message_id;

        var instance = {};
        instance._locals = {};
        instance._locals.sequence = sequence;

        var compareDeltas = function(a, b) {
            var am = a.message_id;
            var bm = b.message_id;
            return compareIds(am, bm);
        };

        var compareIds = function(am, bm) {
            if (am[1] != bm[1]) {
                return am[1] - bm[1]; // global timestamps
            }
            if (am[2] != bm[2]) {
                return core.stringCompare(am[2], bm[2]); // session ids
            }
            return am[3] - bm[3]; // local timestamps
        };
        instance._locals.compareDeltas = compareDeltas;

        var insertionPoint = function(delta) {
            if (sequence.length === 0) {
                return 0;
            }
            if (sequence.length === 1) {
                return compareDeltas(delta, sequence[0]) > 0 ? 1 : 0;
            }
            var start = 0;
            var end = sequence.length;
            var end_cmp = compareDeltas(delta, sequence[end-1]);
            if (end_cmp >= 0) {
                return end;
            }
            while (end > start && start >= 0) {
                var mid = start + Math.round((end - start) / 2);
                var cmp = compareDeltas(delta, sequence[mid]);
                if (cmp === 0) {
                    return mid;
                } else if (mid >= end) {
                    return end;
                } else if (cmp > 0) {
                    start = mid;
                } else {
                    end = mid;
                }
            }
            return start;
        };
        instance._locals.insertionPoint = insertionPoint;

        var mergeDeltas = function(deltas) {
            var by_node_ids = core.groupBy(deltas, core.gattr('id'));
            var res = {};
            for (var node_id in by_node_ids) {
                if (!by_node_ids.hasOwnProperty(node_id)) continue;
                var nodes = by_node_ids[node_id];
                var node_res = core.inherit(nodes[0]);
                for (var i=1; i < nodes.length; i++) {
                    change.mergeDeltas(node_res, nodes[i]);
                }
                res[node_id] = node_res;
            }
            return core.values(res);
        };
        instance._locals.mergeDeltas = mergeDeltas;

        instance.addDelta = function(delta) {
            delta = core.inherit(delta);
            if (!delta.message_id) {
                delta.message_id = ids.message_id(document_id);
            }
            var idx = insertionPoint(delta);
            sequence.splice(idx, 0, delta);
            if (last_message_id && compareIds(last_message_id, delta.message_id) > 0) {
                last_message_id = delta.message_id;
                return [];
            } else {
                last_message_id = delta.message_id;
                return sequence.slice(idx);
            }
        };

        instance.changeset = function(delta) {
            var sequence = instance.addDelta(delta);
            return mergeDeltas(sequence);
        };

        return instance;

    };

    return timeline;

});
