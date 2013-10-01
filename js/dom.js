define(["core", "Data", "ids"], function(core, data, ids) {

    var dom = {};

    dom.traverse = function(dom_tree, visitor) {
        console.log([dom_tree, visitor]);
        console.trace();
        visitor(dom_tree);
        var children = dom_tree.children;
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

    dom.get_node_id = function(node) {
        return data.get(node, "node_id");
    };

    return dom;
});
