define(["core", "dom", "change", "Data", "schema"], function(core, dom, change, data, schema) {
    
    var enact = {};

    /* @defrecord Delta
    *   id: String
    *   name: String
    *   attrs: Dict
    *   position: {
    *       parent: String
    *       offset: Number}
    *   children: [{kind: String, value: String}, ...]
    */

    enact.getNode = function(parent, id) {
        /* @t String, String -> DOMNode */
        if (id === '_root') {
            return parent;
        } else {
            return parent.querySelector(".dynajot-"+id);
        }
    };

    enact.resolveNode = function(root, node) {
        if (node.kind == 'text') {
            return document.createTextNode(node.value);
        } else {
            return enact.getNode(root, node.value);
        }
    };

    enact.appliesDeltas = function(root) {

        var getNode = core.partial(enact.getNode, root);
        var resolveNode = core.partial(enact.resolveNode, root);

        return function(delta) {
            var id = delta.id;
            var existing_node = getNode(id);
            var parent = delta.position ? getNode(delta.position.parent) : null;
            var nodes = [];
            if (existing_node) {
                nodes.push(existing_node);
            }
            if (parent) {
                nodes.push(parent);
            }
            change.nodeTransactions(root, nodes, function() {
                if (existing_node) {
                    console.log(existing_node);
                    if (parent) {
                        console.log(parent);
                        dom.yankNode(existing_node);
                        dom.insertNodeAt(parent, existing_node, delta.position.index);
                    }

                    if (delta.attrs) {
                        core.each((delta.attrs['+'] || []), function(val, key) {
                            existing_node.setAttribute(key, val);
                        });
                        core.each((delta.attrs['-'] || []), function(val, key) {
                            existing_node.removeAttribute(key);
                        });
                    }

                    if (delta.children) {
                        core.each(delta.children, function(slice) {
                            console.log(existing_node, slice);
                            dom.spliceNodes(
                                existing_node, slice.start, slice.end,
                                core.clean(core.map(slice.value, resolveNode)));
                        });
                    }
                } else if (delta.create) {
                    var result = document.createElement(delta.name);
                    if (delta.attrs) {
                        core.each((delta.attrs['+'] || []), function(v, k) {
                            result.setAttribute(k, v);
                        });
                        core.each((delta.attrs['-'] || []), function(v, k) {
                            result.removeAttribute(k);
                        });
                    }
                    if (delta.children) {
                        var children = delta.children;
                        children.sort(function(a, b) {
                            return b.start - a.start;
                        });
                        core.each(delta.children, function(slice) {
                            core.each(slice.value, function(item) {
                                var cn = resolveNode(item);
                                if (cn) {
                                    result.appendChild(cn);
                                } else {
                                    // don't have the child, but need the indexes to still be right
                                    result.appendChild(document.createTextNode(''));
                                }
                            });
                        });
                    }
                    dom.set_node_id(result, delta.id);
                    dom.insertNodeAt(parent, result, delta.position.index);
                } else {
                    console.log(delta, "doesn't exist");
                }
            });
        };
    };


    return enact;
});
