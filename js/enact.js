define(["core", "dom", "change"], function(core, dom, change) {
    
    var enact = {};

    enact.getNode = function(parent, id) {
        if (id === '_root') {
            return parent;
        } else {
            return parent.querySelector(".dynajot-"+id);
        }
    };

    enact.reHydrateNode = function(inp) {
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

    enact.appliesDeltas = function(root) {
        var resolution_index = {};

        var getNode = core.partial(enact.getNode, root);

        var maybeFinish = function(delta) {
            var parent = getNode(delta.position.parent);
            if (!parent) return;
            if (core.some(
                    delta.children,
                    function(c) { return c.resolved === false;})) {
                return;
            }
            var hydrated = enact.reHydrateNode(delta);
            core.insertNodeAt(parent, hydrated, delta.position.index);
            change.updateState(parent);
        };

        var doCreate = function(delta) {
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
                        core.each(delta.children, function(slice) {
                            var new_nodes = core.map(slice.value, function(node) {
                                if (node.kind == 'text') {
                                    return document.createTextNode(node.value);
                                } else if (node.kind == 'id') {
                                    var res = getNode(node.value);
                                    core.yankNode(res);
                                    return res;
                                } else {
                                    return enact.reHydrateNode(node);
                                }
                            });
                            console.log(new_nodes);
                            core.spliceNodes(node, slice.start, slice.end, new_nodes);
                        });
                    }

                });

            }
        };
    };

    return enact;
});
