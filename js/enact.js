define(["core", "dom", "change", "Data"], function(core, dom, change, data) {
    
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

    enact.reHydrateNode = function(inp) {
        /* @t Delta -> DOMNode */
        if (inp.kind === 'text') {
            return document.createTextNode(inp.value);
        } else {
            var res = document.createElement(inp.name);
            var attrs = inp.attrs || {};
            core.each(inp.attrs, function(v, k) {
                res.setAttribute(k, v);
            });
            dom.set_node_id(res, inp.id);
            if (inp.children) {
                core.each(inp.children, function(c) {
                    res.appendChild(enact.reHydrateNode(c));
                });
            }
            change.updateState(res);
            return res;
        }
    };

    /* @t core.partial = (?A, ?B... -> ?C), ?A -> (?B... -> ?C) */
    /* @t core.reduce = [?A, ...], (?A, ?A -> ?A) -> ?A */
    enact.appliesDeltas = function(root) {
        /* @t DOMNode -> (Delta -> null) */
        var resolution_index = {};

        var getNode = core.partial(enact.getNode, root);

        var maybeFinish = function(delta) {
            /* @t Delta -> null */
            var parent = getNode(delta.position.parent);
            if (!parent) return;
            if (core.some(
                    delta.children,
                    function(c) { return c.resolved === false;})) {
                return;
            }
            var hydrated = enact.reHydrateNode(delta);
            console.log('ps', delta.position);
            dom.insertNodeAt(parent, hydrated, delta.position.index);
            change.updateState(parent);
        };

        var doCreate = function(delta) {
            /* @t Delta -> null */
            var parent = delta.position.parent;
            var children = delta.children;
            
            core.each(children, function(child) {
                if (child.kind === 'id') {
                    resolution_index[child.value] = delta;
                    child.resolved = false;
                }
            });

            var resolved_parent = resolution_index[parent];
            if (resolved_parent) {
                core.replace(resolved_parent.children, function(child) {
                    if (child.value == delta.id) {
                        return delta;
                    } else {
                        return false;
                    }
                });
                delete resolution_index[parent];
                maybeFinish(resolved_parent);
            }

            maybeFinish(delta);
        };

        return function(delta) {
            /* @t Delta -> null */
            var node = getNode(delta.id);
            if (!node) {
                doCreate(delta);
            } else {
                var nodes = [node];
                var parent;
                if (delta.position && delta.position.parnet) {
                    parent = getNode(delta.position.parent);
                } else {
                    parent = null;
                }

                if (parent) {
                    nodes.push(parent);
                }

                change.nodeTransactions(root, nodes, function() {

                    if (parent) {
                        dom.yankNode(node);
                        dom.insertNodeAt(parent, node, delta.position.index);
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
                            var new_nodes = core.map(slice.value, function(node) {
                                if (node.kind == 'text') {
                                    return document.createTextNode(node.value);
                                } else if (node.kind == 'id') {
                                    var res = getNode(node.value);
                                    dom.yankNode(res);
                                    return res;
                                } else {
                                    console.log(node);
                                    console.trace();
                                }
                            });
                            console.log('nn', slice, new_nodes);
                            console.log(new_nodes);
                            dom.spliceNodes(node, slice.start, slice.end, new_nodes);
                        });
                    }

                });

            }
        };
    };

    return enact;
});
