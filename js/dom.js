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
            parts = core.filter(prev.split(), function(part) {
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
        core.each(arr, function(node) {
            res.appendChild(node);
        });
        return res;
    };
   
    dom.getChildNodes = function(node) {
        /* @t DOMNode -> [DOMNode, ...] */
        return core.toArray(node.childNodes);
    };

    dom.removeAllChildren = function(node) {
        while(node.firstChild) {
            var child = node.firstChild;
            node.removeChild(child);
        }
    };

    dom.mergeChildren = function(node, children) { // actual merge later
        dom.removeAllChildren(node);
        core.each(children, function(child) {
            //console.log('adding child', child, child.nodeType);
            node.appendChild(child);
        });
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

    dom.insertNodeAt = function(parent, child, index) {
        /* @t DOMNode, DOMNode, Number -> null */
        //if (!parent) console.trace();
        //if (!parent.children) console.trace();
        var after = parent.childNodes[index];

        if (!after) {
            parent.appendChild(child);
        } else if (after.nodeType == Node.ELEMENT_NODE) {
            parent.insertBefore(child, after);
        } else {
            var fragment = document.createDocumentFragment();
            fragment.appendChild(child);
            while(after && after.nodeType != Node.ELEMENT_NODE) {
                parent.removeChild(after);
                fragment.appendChild(after);
                after = after.nextSibling;
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

    return dom;
});
