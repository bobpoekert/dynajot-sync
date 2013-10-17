/* Cross-browser dom mutation events 
* */
define(['dom', 'core'], function(dom, core) {

    var res = {};

    res.throttledPoll = function(callback, min_interval) {
        var interval = min_interval;
        var runner = function() {
            var start = Date.now();
            callback();
            var time_taken = Date.now() - start;
            interval = Math.round((min_interval + time_taken*2) / 2);
            setTimeout(runner, interval);
        };
    };

    res.onChange = function(node, callback, interval) {
        /* callback gets called with changed nodes in the subtree rooted at the given node.
        * NOTE: callback may be called when there isn't actually a change.
        * It's the caller's responsibility to check before doing anything.
        * Not checking before modifying the dom may result in infinite recursion!
        */

        var inner_callback = core.uniqueDebounce(callback, interval);

        var outer_callback = function(target) {
            if (!dom.isChildOf(target, node)) {
                inner_callback(target);
            }
        };

        if (typeof(MutationObserver) !== 'undefined') {
            var observer = new MutationObserver(function(changes) {
                for (var i=0; i < changes.length; i++) {
                    var change = changes[i];
                    dom.traverse(change.target, outer_callback);
                }
            });
            observer.observe(node, {
                'childList':true,
                'attributes':true,
                'characterData':true,
                'subtree':true
            });
        } else {
            node.addEventListener('DOMSubtreeModified', function(evt) {
                dom.traverse(evt.target || node, outer_callback);
            });
        }

        setInterval(function() {
            dom.traverse(node, callback);
        }, 500);
    };

    return res;

});
