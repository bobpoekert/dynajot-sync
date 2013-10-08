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

    enact.reHydrateNode = function(inp, child_nodes) {
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
        var create_callbacks = {};

        var getNode = core.partial(enact.getNode, root);

        var resolveId = function(id, callback) {
            if (!id) {
                callback(null);
                return;
            }
            var node = getNode(id);
            if (node) {
                callback(node);
            } else if (create_callbacks[id]) {
                create_callbacks[id].push(callback);
            } else {
                create_callbacks[id] = [callback];
            }
        };

        var makeNode = function(delta) {
            if (delta.kind == 'text') {
                return document.createTextNode(delta.value);
            } else if (delta.kind == 'id') {
                return getNode(delta.value);
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

        var resolveChild = function(child, callback) {
            var m = core.multi(function(nodes) {
                var copy = core.inherit(child);
                copy.value = nodes;
                callback(copy);
            });
            core.each(child.value, function(node) {
                resolveNode(node, m.getCallback());
            });
            m.start();
        };

        var resolveChildren = function(children, callback) {
            var m = core.multi(callback);
            core.each(children, function(child) {
                resolveChild(child, m.getCallback());
            });
            m.start();
        };

        var resolveNodes = function(deltas, callback) {
            /* @t [Delta, ...], (DOMNode -> null) -> null */
            var m = core.multi(callback);
            core.each(deltas, function(delta) {
                resolveNode(delta, m.getCallback());
            });
            m.start();
        };

        var resolveDeps = function(node_id, parent_id, children, callback) {
            /* @t String, String, [Node, ...], (DOMNode, DOMNode, [DOMNode, ...] -> null) -> null */
            callback(
                getNode(node_id),
                getNode(parent_id),
                core.map(children, makeNode));
            return;
            
            
            var m = core.multi(core.splat(callback));
            if (node_id) {
                console.log('node_id', node_id);
                resolveId(node_id, m.getCallback());
            } else {
                m.addValue(null);
            }
            if (parent_id) {
                console.log('parent_id', parent_id);
                resolveId(parent_id, m.getCallback());
            } else {
                m.addValue(null);
            }
            resolveChildren(children, m.getCallback());
            m.start();
        };

        var finishCreate = function(delta, self, parent, children) {
            /* @t Delta -> null */
            console.log('finishCreate', delta, self, parent, children);
            var res = document.createElement(delta.name);
            var attrs = delta.attrs || {};
            core.each(delta.attrs, function(v, k) {
                res.setAttribute(k, v);
            });
            dom.set_node_id(res, delta.id);
            core.each(children, function(c) {
                if (c) res.appendChild(c);
            });
            change.updateState(res);
            dom.insertNodeAt(parent, res, delta.position.index);
            change.updateState(parent);
            deliverNode(res);
        };

        var doCreate = function(delta) {
            /* @t Delta -> null */
            var parent = delta.position ? delta.position.parent : null;
            var children = delta.children;

            core.each(children, function(child) {
                if (child.kind === 'id') {
                    if (!(child.position && child.position.parent)) {
                        if (!child.position) child.position = {};
                        child.position.parent = delta.id;
                    }
                }
            });

            resolveDeps(
                null,
                parent,
                delta.children || [],
                core.partial(finishCreate, delta));
        };

        return function(delta) {
            //console.log('delta', delta);
            /* @t Delta -> null */
            if (delta.create) {
                doCreate(delta);
                return;
            }
            resolveDeps(
                delta.id,
                delta.position ? delta.position.parent : null,
                delta.children || [],
                function(node, parent, child_nodes) {
                    var nodes = [node];
                    if (child_nodes) {
                        core.each(child_nodes, function(slice) {
                            nodes.push.apply(nodes, slice.value);
                        });
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

                        core.each(child_nodes, function(slice) {  
                            dom.spliceNodes(
                                node, slice.start, slice.end, slice.value);
                        });
                    });
                });
        };
    };

    return enact;
});
