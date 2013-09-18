define(["core"], function(core) {
    
    var enact = {};

    enact.getNode = function(id) {
        return document.body.querySelector(".dynajot-"+id);
    };

    enact.applyDelta = function(delta) {
        var node;
        
        if (delta.create) {
            node = document.createElement(delta.name);
        } else {
            node = enact.getNode(delta.id);
        }

        if (delta.position) {
            core.yankNode(node);
            var parent = enact.getNode(delta.position.parent);
            core.insertNodeAt(parent, node, delta.position.index);
        }

        if (delta.attrs) {
            core.each((delta.attrs['+'] || []), function(val, key) {
                node.setAttribute(key, val);
            });
            core.each((delta.attrs['-'] || []), function(val, key) {
                node.removeAttribute(key);
            });
        }

        if (delta.children) {
            core.each(delta.children, function(slice) {
                console.log(slice);
                var new_nodes = core.map(slice.value, function(node) {
                    if (node.kind == 'text') {
                        return document.createTextNode(node.value);
                    } else if (node.kind == 'id') {
                        var res = enact.getNode(node.value);
                        core.yankNode(res);
                        return res;
                    }
                });
                core.spliceNodes(node, slice.start, slice.end, new_nodes);
            });
        }
    };

    return enact;
});
