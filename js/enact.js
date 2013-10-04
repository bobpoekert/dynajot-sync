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
        var create_callbacks = {};

        var getNode = core.partial(enact.getNode, root);

        var resolveId = function(id, callback) {
            if (!id) {
                callback(null);
                return;
            }
            var node = getNode(delta.value);
            if (node) {
                callback(node);
            } else if (create_callbacks[delta.id]) {
                create_callbacks[delta.id].push(callback);
            } else {
                create_callbacks[delta.id] = [callback];
            }
        };

        var resolveNode = function(delta, callback) {
            /* @t Delta, (DOMNode -> null) -> null */
            if (delta.kind == 'text') {
                callback(document.createTextNode(delta.value));
            } else if (delta.kind == 'id') {
                resolveId(delta.value, callback);
            }
        };

        var deliverNode = function(id, node) {
            /* @t String, DOMNode -> null */
            var callbacks = create_callbacks[id];
            if (callbacks) {
                while(callbacks.length > 0) {
                    callbacks.shift()(node);
                }
                delete create_callbacks[id];
            }
        };

        var resolveNodes = function(deltas, callback) {
            /* @t [Delta, ...], (DOMNode -> null) -> null */
            var m = core.multi(callback);
            core.each(deltas, function(delta) {
                resolveNode(delta, m.getCallback());
            });
            m.start();
        };

        var resolveDelta = function(delta, callback) {
            resolveNodes(
                [{'kind':'id', 'value':delta.id}].concat(delta.children),
                core.unsplat(1, callback));
        };

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
            dom.insertNodeAt(parent, hydrated, delta.position.index);
            change.updateState(parent);
            deliverNode(hydrated);
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
            var deps = [{'kind':'id',
                         'value':delta.position ? delta.position.parent : null}
                        ].concat(delta.children || []);
            console.log(deps);
            if (delta.create) {
                doCreate(delta);
                return;
            }
            resolveNodes(deps, core.unsplat(1, function(parent, child_nodes) {
                var node = getNode(delta.id);
                var nodes = [node].concat(childNodes);
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
                        dom.spliceNodes(
                            node, slice.start, slice.end, childNodes);
                    }

                });
            }));
        };
    };

    return enact;
});
