/* Cross-browser dom mutation events 
*
* Event types: attributes, characterData, subtree
*
* */
define(function() {

    if (MutationObserver) {

        return function(node, events, callback) {
            var observer = new MutationObserver(function(changes) {

            });

            var config = {};
            for (var i=0; i < events.length; i++) {
                config[events[i]] = true;
            }
            observer.observe(node, config);
            return function() {
                observer.disconnect();
            };
        };

    } else {

        var event_mapping = {
            'attributes':'DOMAttrModified',
            'characterData':'DOMCharacterDataModified',
            'subtree':'DOMSubtreeModified'
        };


        return function(node, events, callback) {

        };
    }

});
