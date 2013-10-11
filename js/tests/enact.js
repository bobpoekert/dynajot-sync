define(["enact", 'core', "tests/action_log", "tests/action_result_html"], function(enact, core, action_log, action_result) {
    module("enact (tests/enact.js)");

    test("getNode", function () {
        ok(true);
    });

    var deltas = core.map(action_log, core.gattr('value'));
  
    var locals = applier._locals;

    var harness = function (fn) {
        var root = document.createElement("div");
        var applier = enact.appliesDeltas(root);
        return fn(root, applier);
    };

    test("appliesDeltas", function () {
        harness(function (root, applier) {
            var apply_deltas = action_log;
            var check_change_functions = [];
            var deltas_applied = 0;

            core.each(deltas, applier);

            // equal(root.innerHTML, action_result);
        });
    });

    test("resolveId", function () {
        harness(function (root, applier) {
            
        });
    });
});