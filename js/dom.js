define(["core", "Data", "ids"], function(core, data, ids) {

    var dom = {};

    dom.traverse = function(dom_tree, visitor) {
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

    dom.node_id = function(node, document_id) {
        var res = data.get(node, 'node_id');
        if (res) {
            return res;
        }
        var new_id = ids.node_id(document_id);
        data.set(node, 'node_id', new_id);
        var oldClass = node.getAttribute("class");
        var newClass = "dynajot-"+new_id;
        if (oldClass !== null) {
            newClass += " " + oldClass;
        }
        node.className = newClass;
        return new_id;
    };

    return dom;
});
