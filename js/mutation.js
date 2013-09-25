/* Cross-browser dom mutation events 
* */
define(['dom', 'core'], function(dom, core) {

    var res = {};

    res.onChange = function(node, callback, interval) {
        /* callback gets called with changed nodes in the subtree rooted at the given node.
        * NOTE: callback may be called when there isn't actually a change.
        * It's the caller's responsibility to check before doing anything.
        * Not checking before modifying the dom may result in infinite recursion!
        */

        callback = core.uniqueDebounce(callback, interval);

        if (typeof(MutationObserver) !== 'undefined') {
            var observer = new MutationObserver(function(changes) {
                for (var i=0; i < changes.length; i++) {
                    var change = changes[i];
                    if (change.type == 'childList') {
                        dom.traverse(change.target, callback);
                    } else {
                        callback(change.target);
                    }
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
                dom.traverse(evt.target || node, callback);
            });
            
            // DOMSubtreeModified doesn't work for new nodes in IE9,
            // so we still have to poll.
            // (also DOMSubtreeModified isn't supported at all in IE8)
            setInterval(function() {
                dom.traverse(node, callback);
            }, 500);
        }
    };

    return res;

});
