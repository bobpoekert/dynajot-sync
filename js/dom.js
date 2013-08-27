define(["core", "Data"], function(core, data) {

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
        console.log(index);
        return [parent, index];
    };

    dom.node_id = function(node) {
        return data.get(node, 'node_id');
    };

    return dom;
});
