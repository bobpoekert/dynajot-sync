define(["ids", "core"], function(ids, core) {

    var timeline = {};


    timeline.make = function(document_id) {

        var sequence = [];

        var instance = {};

        var compareDeltas = function(a, b) {
            var am = a.message_id;
            var bm = b.message_id;
            if (am[1] != bm[1]) {
                return am[1] - bm[1]; // global timestamps
            }
            if (am[2] != bm[2]) {
                return core.stringCompare(am[2], bm[2]); // session ids
            }
            return 
        };

        var insertionPoint = function(delta) {
            var start = 0;
            var end = sequence.length;
            var end_cmp = compareDeltas(delta, sequence[end-1]);
            if (end_cmp >= 0) {
                return end;
            }
            while (end > start) {
                var mid = start + Math.floor((end - start) / 2);
                var cmp = compareDeltas(delta, sequence[mid]);
                if (cmp === 0) {
                    return mid;
                } else if (cmp > 0) {
                    start = mid;
                } else {
                    end = mid;
                }
            }
            return start;
        };

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

        instance.addDelta = function(delta) {
            delta = core.inherit(delta);
            if (!delta.message_id) {
                delta.message_id = ids.message_id(document_id);
            }
            var idx = insertionPoint(delta);
            sequence.splice(idx, 0, delta);
            return sequence.slice(idx);
        };

    };

    return timeline;

});
