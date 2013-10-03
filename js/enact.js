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
        
        var create_callbacks = {};

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
            core.insertNodeAt(parent, hydrated, delta.position.index);
            var cb = create_callbacks[delta.id];
            while (cb && cb.length > 0) {
                cb.shift()(hydrated);
            }
            change.updateState(parent);
        };
        
        var asyncGetNode = function(id, fn) {
            var node = getNode(id);
            if (node) {
                fn(node);
                return;
            }
            var cb = create_callbacks[id];
            if (!cb) {
                cb = [];
                create_callbacks[id] = cb;
            }
            cb.push(fn);
        };
        
        var hasAllChildren = function(delta) {
            for (var i=0; i < delta.children.length; i++) {
                var c = delta.children[i];
                if (c.kind != 'id') continue;
                if (getNode(c.value)) continue;
                return false;
            }
            return true;
        };


        var whenCanApplyDelta = function(delta, cb) {
            var node = getNode(delta.id);
            var recur = core.partial(whenCanApplyDelta, delta, cb);
            if (!node) {
                asyncGetNode(delta.id, recur);
                return;
            }
            var child_nodes = [];
            for (var i=0; i < delta.children.length; i++) {
                var c = delta.children[i];
                if (c === true) {
                    child_nodes.append(true);
                    continue;
                }
                if (c.kind == 'text') {
                    child_nodes.push(document.createTextNode(c.value));
                    continue;
                }
                var cn = getNode(c.value);
                if (cn) {
                    child_nodes.push(cn);
                    continue;
                }
                asyncGetNode(c.value, recur);
                return;
            }
            console.log(child_nodes);
            cb(delta, node, child_nodes);
        };


        var doCreate = function(delta) {
            /* @t Delta -> null */
            var parent = delta.position && delta.position.parent;
            var children = delta.children;
            
            core.each(children, function(child) {
                if (child.kind === 'id') {
                    resolution_index[child.value] = delta;
                    child.resolved = false;
                }
            });

            if (parent) {
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
            }

            maybeFinish(delta);
        };

        return function(delta) {
            /* @t Delta -> null */
            whenCanApplyDelta(delta, function(node, child_nodes) {
                console.log(node, child_nodes);
                if (node.position) {
                    doCreate(delta);
                } else {
                    var nodes = [node];
                    var parent;
                    if (delta.position && delta.position.parnet) {
                        parent = getNode(delta.position.parent);
                    } else {
                        parent = null;
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
                            console.log(target_children, child_nodes);
                            for (i=0; i < delta.children.length; i++) {
                                var child = child_nodes[i];
                                var target = target_children[i];
                                if (child === true) {
                                    continue;
                                }
                                core.yankNode(child);
                                if (target) {
                                    node.replaceChild(child, target);
                                } else {
                                    node.appendChild(child);
                                }
                                change.updateState(child);
                            }
                        }

                    });

                }
            });
        };
    };

    return enact;
});
