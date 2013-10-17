define(["core", "Data", "ids"], function(core, data, ids) {

    var dom = {};

    dom.traverse = function(dom_tree, visitor) {
        /* @t DOMNode, (DOMNode -> null) -> null */
        if (!dom_tree) return;
        if (dom_tree.nodeType == Node.ELEMENT_NODE) visitor(dom_tree);
        // apparently DocumentFragments don't have .children
        // and their .childNodes includes text nodes
        var children = dom.getChildNodes(dom_tree);
        for (var i=0; i < children.length; i++) {
            var c = children[i];
            if (c.nodeType == Node.ELEMENT_NODE) {
                dom.traverse(children[i], visitor);
            }
        }
    };

    dom.nodeCompare = function(a, b) {
        if (a == b) return true;
        if (a.nodeType != b.nodeType) return false;
        if (a.nodeType == Node.TEXT_NODE) {
            return a.data == b.data;
        } else {
            return false;
        }
    };

    dom.stringifyNode = function(node) {
        if (node.nodeType == Node.TEXT_NODE) {
            return 't:'+node.data;
        } else if (node.nodeType == Node.ELEMENT_NODE) {
            return dom.get_node_id(node);
        } else {
            return '';
        }
    };

    dom.nodeParentIndex = function(node) {
        /* @t DOMNode -> [DOMNode, Number] */
        var parent = node.parentNode;
        var index = core.indexOf(dom.getChildNodes(parent), node);
        return [parent, index];
    };

    dom.elementParentIndex = function(node) {
        /* @t DOMNode -> [DOMNode, Number] */
        var parent = node.parentNode;
        var children = dom.getChildNodes(parent);
        var index = core.indexOf(core.filter(children, dom.isElement), node);
        return [parent, index];
    };

    dom.isElement = function(node) {
        return node.nodeType == Node.ELEMENT_NODE;
    };

    dom.isTextNode = function(node) {
        /* @t DOMNode -> Boolean */
        return !!(node && node.nodeType === Node.TEXT_NODE);
    };

    dom.iterAttributes = function(node, iterator) {
        for (var i=0; i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            iterator(i.name, i.value);
        }
    };

    dom.updateAttributes = function(node, new_attributes, removed_attributes) {
        var seen_attrs = [];
        dom.iterAttributes(node, function(k, v) {
            if (new_attributes[k]) {
                if (new_attributes[k] != v) {
                    node.setAttribute(k, v);
                }
            } else {
                node.removeAttribute(k);
            }
            seen_attrs.push(k);
        });
        core.each(new_attributes, function(v, k) {
            //if (core.indexOf(seen_attrs) == -1) {
                node.setAttribute(k, v);
            //}
        });
        core.each(removed_attributes, function(v, k) {
            node.removeAttribute(k);
        });
    };

    dom.removeAllAttributes = function(node) {
        var attribute_keys = [];
        dom.iterAttributes(node, function(k, v) {
            attribute_keys.push(k);
        });
        core.each(attribute_keys, function(k) {
            node.removeAttribute(k);
        });
    };

    dom.setAttributes = function(node, attrs) {
        core.each(attrs, function(v, k) {
            node.setAttribute(k, v);
        });
    };

    dom.setIdClass = function(node, id) {
        /* @t DOMNode, String -> null */
        var prev = node.getAttribute('class');
        var parts;
        if (prev) {
            parts = core.filter(prev.split(/\s+/g), function(part) {
                return !(/^dynajot-/.test(part));
            });
            res = parts.join(' ');
        } else {
            parts = [];
        }
        parts.push('dynajot-'+id);
        node.setAttribute('class', parts.join(' '));
    };

    dom.toFragment = function(arr) {
        /* @t [DOMNode, ...] -> DOMFragment */
        var res = document.createDocumentFragment();
        var i;
        for (i=0; i < arr.length; i++) {
            res.appendChild(arr[i]);
        }
        return res;
    };
   
    dom.getChildNodes = function(node) {
        /* @t DOMNode -> [DOMNode, ...] */
        if (node) {
            return core.toArray(node.childNodes);
        } else {
            return [];
        }
    };

    dom.removeAllChildren = function(node) {
        while(node.firstChild) {
            node.removeChild(node.firstChild);
        }
        //node.innerHTML = '';
    };

    dom.mergeChildren = function(node, children, removed_children) {
        /*var a_nodes = dom.getChildNodes(node);
        var cached_text_nodes = {};

        core.each(a_nodes, function(node) {
            if (node.nodeType == Node.TEXT_NODE) {
                if (cached_text_nodes[node.data]) {
                    cached_text_nodes[node.data].push(node);
                } else {
                    cached_text_nodes[node.data] = [node];
                }
            }
        });

        var restored_children = core.map(children, function(child) {
            if (child.nodeType == Node.ELEMENT_NODE) return child;
            if (cached_text_nodes.hasOwnProperty(child.data)) {
                var arr = cached_text_nodes[child.data];
                if (arr.length > 0) {
                    var res = arr.shift();
                    res.parentNode.removeChild(res);
                    return res;
                }
            }
            return child;
        });*/

        /*var removed_keys = {};
        core.each(removed_children, function(node) {
            var k = node.kind == 'text' ? 't:'+node.value : node.value; // stringifyNode
            removed_keys[k] = true;
        });

        var b_nodes = children;
        var merged = core.arrayMerge(a_nodes, b_nodes, dom.stringifyNode);
        */
        /*merged = core.filter(merged, function(el) {
            return !(dom.stringifyNode(el) in removed_keys);
        });*/
        dom.removeAllChildren(node);
        var frag = dom.toFragment(children);
        node.appendChild(frag);
    };

    dom.spliceNodes = function(target, start, end, replacement) {
        /* @t DOMNode, Number, Number, [DOMNode, ...] -> null */
        var children = core.filter(
            dom.getChildNodes(target),
            function(node) {
                return core.indexOf(replacement, node) === -1;
            });

        var i;
        var e;

        var fragment = dom.toFragment(replacement);

        for (i=start; i < Math.min(end, children.length); i++) {
            if (children[i]) {
                target.removeChild(children[i]);
            }
        }

        var after = children[end];
        if (after) {
            target.insertBefore(fragment, after);
        } else {
            target.appendChild(fragment);
        }
    };

    dom.yankNode = function(node) {
        /* @t DOMNode -> null */
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    };

    var bogus = 0;
    dom.insertNodeAt = function(parent, child, index) {
        /* @t DOMNode, DOMNode, Number -> null */
        //if (!parent) console.trace();
        //if (!parent.children) console.trace();
        var after = parent.childNodes[index];

        if (!after) {
            parent.appendChild(child);
        } else if (after.nodeType == Node.ELEMENT_NODE) {
            // confirm("ready to accept change?");
            parent.insertBefore(child, after);
        } else {
            var fragment = document.createDocumentFragment();
            fragment.appendChild(child);
            while(after && after.nodeType != Node.ELEMENT_NODE) {
                var nxt = after.nextSibling;
                parent.removeChild(after);
                fragment.appendChild(after);
                after = nxt;
            }
            if (after) {
                parent.insertBefore(fragment, after);
            } else {
                parent.appendChild(fragment);
            }
        }
    };

    dom.isChildOf = function(parent, child) {
        /* @t DOMNode, DOMNode -> Boolean */
        var accum = child;
        while(accum && accum != document) {
            if (accum.parentNode == parent) {
                return true;
            }
            accum = accum.parentNode;
        }
        return false;
    };

    dom.getNodeById = function(node) {
        var d = data.get(node, "node_id");
        if (d) {
            return d;
        } else {
            var cls = node.getAttribute('class');
            if (!cls) {
                return null;
            }
            var ids = core.filter(cls.split(), core.reTester(/^dynajot-.*/));
            return ids.length > 0 ? ids[0] : null;
        }
    };

    dom.set_node_id = function(node, id) {
        /* @t DOMNode, String -> null */
        data.set(node, 'node_id', id);
        dom.setIdClass(node, id);
    };

    dom.assign_node_id = function(root, node, document_id) {
        /* @t DOMNode, DOMNode, String -> String */
        if (node == root) { // ? comparison of dom nodes?
            return "_root";
        }
        var res = data.get(node, 'node_id');
        if (res) {
            return res;
        }
        var new_id = ids.node_id(document_id);
        dom.set_node_id(node, new_id);
        return new_id;
    };

    dom.assign_all_ids = function(root, node, document_id) {
        /* @t DOMNode, DOMNode, String -> null */
        dom.traverse(node, function(inner) {
            dom.assign_node_id(root, inner, document_id);
        });
    };

    dom.get_node_id = function(node) {
        /* @t DOMNode -> String */
        return data.get(node, "node_id");
    };

    return dom;
});
