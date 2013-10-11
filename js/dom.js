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

    dom.setIdClass = function(node, id) {
        /* @t DOMNode, String -> null */
        var prev = node.getAttribute('class');
        var res = null;
        if (prev) {
            var chars = [];
            res = prev.replace((new RegExp('dynajot-(?!'+id+').*(?=\s|$)')), '', 'g');
        } else {
            res = '';
        }
        var repl = 'dynajot-'+id;
        if (res.indexOf(repl) === -1) {
            res += ' ' + repl;
        }
        res = res.replace(/\s+/g, ' ');
        node.setAttribute('class', res);
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

    dom.mergeChildren = function(node, children) { // actual merge later
        core.each(node.childNodes, function(child) {
            node.removeChild(child);
        });
        core.each(children, function(child) {
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
        var after = parent.children[index];
        if (after) {
            parent.insertBefore(child, after);
        } else {
            parent.appendChild(child);
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
