define(["enact", "core"], function (enact, core) {

    var playback = {};

    var playback_interval = 70;
    var applier = null;

    playback.root = null;
    playback.slider = null;
    playback.deltas = [];

    var disableMouseEvents = function (node) {
        var node = document.createElement('style');
        node.innerHTML = '#todoapp { pointer-events: none }'; // change this!
        document.body.appendChild(node);
    };

    playback.init = function (node) {
        var doc_token = window.location.hash.substr(1);
        playback.fetchDeltas(doc_token, function () {
            playback.root = node;
            playback.slider = $("#slider");
            playback.slider.slider({
                range: "min",
                slide: handleScroll
            });
            applier = enact.appliesDeltas(playback.root);
            playback.playAllDeltas();
            disableMouseEvents();
            $("#backlink").attr("href", "/examples/todo/index.html#"+doc_token);
        });
    };

    var handleScroll = core.throttle(function () {
        var pctDone = playback.slider.slider('value');
        var chosenIndex = Math.round(pctDone * (playback.deltas.length-1) / 100);
        playDeltaUpTo(chosenIndex);
    }, 100);

    playback.fetchDeltas = function (doc_token, callback) {
        $.get('http://localhost:5000/deltas/' + doc_token, function (resp) {
            playback.deltas = resp[doc_token];
            callback(resp);
        });
    };

    var playDeltaUpTo = function (limit) {
        if (limit > playback.deltas.length) return;
        for (var i=0; i < limit; i++) {
            playDelta(applier, playback.deltas[i].value.value, 1);
        }
    };

    var playDelta = function (applier, delta, i, playback_mode) {
        var offset = i*playback_interval;
        playback_mode = playback_mode || false;

        return (function () {
            setTimeout(function () {
                applier(delta);
                if (playback_mode) {
                    playback.slider.slider({
                        value: i*100/playback.deltas.length,
                        slide: handleScroll
                    });
                }
            }, offset);
        })();
    };

    playback.playAllDeltas = function () {
        for (var i=0; i < playback.deltas.length; i++) {
            playDelta(applier, playback.deltas[i].value.value, i, true);
        }
    };

    return playback;
});