define(["enact", "core"], function (enact, core) {

    var playback = {};

    var playback_interval = 50;
    playback.root = null;

    playback.init = function (node) {
        playback.root = node;
    };

    playback.fetchDeltas = function (doc_token, callback) {
        $.get('http://localhost:5000/deltas/' + doc_token, function (resp) {
            callback(resp);
        });
    };

    playback.playUpTo = function (delta_i) {
        // grab from the server all deltas up to i and play through through
        var deltas = [];
        playback.playDeltas(deltas);
    };

    var playDelta = function (applier, delta, i) {
        var offset = i*playback_interval;

        return (function () {
            setTimeout(function () {
                applier(delta);
            }, offset);
        })();
    };

    playback.playAllDeltas = function () {
        var doc_token = window.location.hash.substr(1);
        var applier = enact.appliesDeltas(playback.root);

        playback.fetchDeltas(doc_token, function (resp) {
            var deltaMsgs = resp[doc_token];
            for (var i=0; i < deltaMsgs.length; i++) {
                playDelta(applier, deltaMsgs[i].value.value, i);
            }
        });
    };

    return playback;
});