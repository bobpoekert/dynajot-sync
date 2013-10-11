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
        if (typeof(id) != 'string') {
            console.trace();
        }
        if (id === '_root') {
            return parent;
        } else {
            return parent.querySelector(".dynajot-"+id);
        }
    };

    enact.resolveNode = function(root, node) {
        //console.log('resolve', node);
        if (node.kind == 'text') {
            return document.createTextNode(node.value);
        } else {
            return enact.getNode(root, node.value);
        }
    };

    enact.insertionIndex = function(target, index) {
        var is_resolved = data.get(target, 'children_resolved');
        console.log('is_resolved', is_resolved);
        if (!is_resolved) return index;
        var offset = 0;
        for (var i=0; i < index; i++) {
            if (!is_resolved[i]) {
                offset++;
            }
        }
        return index - offset;
    };

    enact.insertChildNodeAt = function(parent, child, index) {
        //console.trace();
        var is_resolved = data.get(parent, 'children_resolved');
        var actual_index = is_resolved ? enact.insertionIndex(parent, index) : index;
        dom.insertNodeAt(parent, child, actual_index);
        if (is_resolved) {
            is_resolved[index] = true;
            data.set(parent, 'children_resolved', is_resolved);
        }
    };

    enact.appliesDeltas = function(root) {

        var getNode = core.partial(enact.getNode, root);
        var resolveNode = core.partial(enact.resolveNode, root);

        return function(delta) {
            console.log('apply delta', delta);
            var id = delta.id;
            var existing_node = getNode(id);
            var parent = delta.position ? getNode(delta.position.parent) : null;
            var mergeChildren = function(target, children) {
                var resolved = core.map(children, resolveNode);
                var was_resolved = core.map(resolved, core.truthiness);
                console.log('was_resolved', was_resolved);
                data.set(target, 'children_resolved', was_resolved);
                return dom.mergeChildren(
                    target,
                    core.clean(resolved));
            };
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
                        dom.yankNode(existing_node);
                        enact.insertChildNodeAt(parent, existing_node, delta.position.index);
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
                        mergeChildren(existing_node, delta.children);
                    }
                } else if (delta.create) {
                    console.log(delta);
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
                        mergeChildren(result, delta.children);
                    }
                    dom.set_node_id(result, delta.id);
                    console.log('parent', parent, result, delta.position);
                    enact.insertChildNodeAt(parent, result, delta.position.index);
                } else {
                    console.log(delta, "doesn't exist");
                }
            });
        };
    };


    return enact;
});
