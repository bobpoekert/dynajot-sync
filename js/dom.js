define(["core", "Data", "ids"], function(core, data, ids) {

    var dom = {};

    dom.traverse = function(dom_tree, visitor) {
        if (!dom_tree) return;
        visitor(dom_tree);
        // apparently DocumentFragments don't have .children
        // and their .childNodes includes text nodes
        var children = dom_tree.children || dom_tree.childNodes;
        for (var i=0; i < children.length; i++) {
            dom.traverse(children[i], visitor);
        }
    };

    dom.parentIndex = function(node) {
        var parent = node.parentNode;
        var index = core.indexOf(parent.childNodes, node);
        return [parent, index];
    };
    
    dom.setIdClass = function(node, id) {
        if (!node) console.trace();
        var prev = node.getAttribute('class');
        var res = null;
        if (prev) {
            res = prev.replace((new RegExp('dynajot-(?!'+id+').*?\s*(\s|$)')), '');
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

    dom.set_node_id = function(node, id) {
        data.set(node, 'node_id', id);
        dom.setIdClass(node, id);
    };

    dom.assign_node_id = function(root, node, document_id) {
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
        dom.traverse(node, function(inner) {
            dom.assign_node_id(root, inner, document_id);
        });
    };

    dom.get_node_id = function(node) {
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
