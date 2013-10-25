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

        var interval;
        var observer;
        var subtree_modified_callback;
        var stopped = false;

        var stop = function() {
            if (stopped) return;
            clearInterval(interval);
            if (observer) {
                observer.disconnect();
            }
            if (subtree_modified_callback) {
                node.removeEventListener('DOMSubtreeModified', subtree_modified_callback);
            }
            stopped = true;
        };
        var inner_callback = core.uniqueDebounce(function(res) {
            if (callback(res) === false) stop();   
        }, interval);

        var outer_callback = function(target) {
            if (stopped) return;
            if (!dom.isChildOf(target, node)) {
                inner_callback(target);
            }
        };

        if (typeof(MutationObserver) !== 'undefined') {
            observer = new MutationObserver(function(changes) {
                if (stopped) return;
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
            subtree_modified_callback = function(evt) {
                if (stopped) return;
                dom.traverse(node, outer_callback);
            };
            //node.addEventListener('DOMSubtreeModified', subtree_modified_callback);
        }

        var last_looper = Date.now();
        var looper = function() {
            if (stopped) {
                return;
            }
            dom.traverse(node, outer_callback);
            setTimeout(looper, Date.now() - last_looper);
            last_looper = Date.now();
        };
        setTimeout(looper, 100);

        return {stop: stop};
    };

    return res;

});
