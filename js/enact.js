define(["core", "dom"], function(core, dom) {
    
    var enact = {};

    enact.getNode = function(id) {
        return document.body.querySelector(".dynajot-"+id);
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
            dom.setIdClass(res, inp.id);
            if (inp.children) {
                core.each(inp.children, function(c) {
                    res.appendChild(enact.reHydrateNode(c));
                });
            }
            return res;
        }
    };

    enact.applyDelta = function(delta) {
        var node;
        if (delta.create) {
            console.log(delta);
            delta.create.id = delta.id;
            node = enact.reHydrateNode(delta.create);
        } else {
            node = enact.getNode(delta.id);
        }

        if (delta.position) {
            core.yankNode(node);
            var parent = enact.getNode(delta.position.parent);
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
                        var res = enact.getNode(node.value);
                        core.yankNode(res);
                        return res;
                    }
                });
                core.spliceNodes(node, slice.start, slice.end, new_nodes);
            });
        }
    };

    return enact;
});
