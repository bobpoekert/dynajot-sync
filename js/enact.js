define(["core", "dom", "change"], function(core, dom, change) {
    
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
            core.insertNodeAt(parent, hydrated, delta.position.index);
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
                        core.yankNode(node);
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
                        var target_children = core.toArray(node.childNodes);
                        for (i=0; i < delta.children.length; i++) {
                            var child = delta.children[i];
                            var target = target_children[i];
                            if (child === true) {
                                continue;
                            }
                            var n;
                            if (child.kind == 'text') {
                                n = document.createTextNode(child.value)
                            } else if (node.kind == 'id') {
                                var n = getNode(child.value);
                                core.yankNode(n);
                            }
                            if (target) {
                                node.replaceChild(n, target);
                            } else {
                                node.appendChild(n);
                            }
                            change.updateState(n);
                        }
                    }

                });

            }
        };
    };

    return enact;
});
