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
        //// console.log('resolve', node);
        if (node.kind == 'text') {
            return document.createTextNode(node.value);
        } else {
            return enact.getNode(root, node.value);
        }
    };

    enact.insertionIndex = function(target, index) {
        var is_resolved = data.get(target, 'children_resolved');
        //// console.log('is_resolved', is_resolved);
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

    enact.appliesDeltas = function(root, getNodeFromServer) {
        var applyDelta;

        var node_queues = {};
        var gotNode = function(node_id, node) {
            applyDelta(node);
            var queue = node_queues[node_id];
            while(queue && queue.length > 0) {
                queue.shift()(node);
            }
            delete node_queues[node_id];
        };
        var getNode = function(node_id, callback) {
            var res = enact.getNode(root, node_id);
            // console.log('getNode', node_id, res);
            if (res) {
                callback(res);
                return;
            }
            if (!node_queues[node_id]) {
                getNodeFromServer(node_id, core.partial(gotNode, node_id));
                node_queues[node_id] = [callback];
            } else {
                node_queues[node_id].push(callback);
            }
        };

        var resolveNode = core.partial(enact.resolveNode, root);

        applyDelta = function(delta) {
            //// console.log('apply delta', delta);
            var id = delta.id;
            var existing_node = enact.getNode(root, id);

            var _applyDelta = function(parent) {
                var mergeChildren = function(target, children) {
                    var resolved = core.map(children, resolveNode);
                    var was_resolved = core.map(resolved, core.truthiness);
                    //// console.log('was_resolved', was_resolved);
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
                        //// console.log(existing_node);
                        if (parent && parent != root) {
                            var existing_parent = existing_node.parentNode;
                            var existing_id = dom.get_node_id(existing_parent);
                            var existing_index = dom.nodeParentIndex(existing_node);
                            if (delta.position.parent != existing_id || delta.position.index != existing_index) {
                                //console.trace();
                                dom.yankNode(existing_node);
                                enact.insertChildNodeAt(parent, existing_node, delta.position.index);
                            }
                        }

                        if (delta.attrs) {
                            dom.updateAttributes(existing_node, delta.attrs);
                        }

                        if (delta.children) {
                            mergeChildren(existing_node, delta.children);
                        }
                    } else {
                        var result = document.createElement(delta.name);
                        if (delta.attrs) {
                            dom.updateAttributes(result, delta.attrs);
                        }
                        if (delta.children) {
                            mergeChildren(result, delta.children);
                        }
                        dom.set_node_id(result, delta.id);
                        //// console.log('parent', parent, result, delta.position);
                        //// console.log(result);
                        enact.insertChildNodeAt(parent, result, delta.position.index);
                    }
                });
            };
            if (delta.position) {
                getNode(delta.position.parent, _applyDelta);
            } else {
                _applyDelta(null);
            }
        };
        return applyDelta;
    };


    return enact;
});
