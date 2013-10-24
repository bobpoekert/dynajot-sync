define([
    "core",
    "Data",
    "dom",
    "difflib",
    "mutation"
], function(core, data, dom, difflib, mutation) {

    var change = {};
    
    var attr_blacklist = {
        "onclick":true,
        "ondblclick":true,
        "onmousedown":true,
        "onmouseup":true,
        "onmouseover":true,
        "onmousemove":true,
        "onmouseout":true,
        "ondragstart":true,
        "ondrag":true,
        "ondragenter":true,
        "ondragleave":true,
        "ondragover":true,
        "ondrop":true,
        "ondragend":true,
        "onkeydown":true,
        "onkeypress":true,
        "onkeyup":true,
        "onload":true,
        "onunload":true,
        "onabort":true,
        "onerror":true,
        "onresize":true,
        "onscroll":true,
        "onselect":true,
        "onchange":true,
        "onsubmit":true,
        "onreset":true,
        "onfocus":true,
        "onblur":true
    };

    change.serializeNode = function(root, node, document_id) {
        if (!node) {
            return {};
        }
        var res = {};
        if (dom.isTextNode(node)) {
            return change.serializeNode(root, node.parent, document_id);
        } else {
            res.attrs = {};
            if (node.hasAttributes()) {
                for (var i=0; i < node.attributes.length; i++) {
                    var attr = node.attributes[i].name;
                    var val = node.attributes[i].value;
                    if (attr_blacklist.hasOwnProperty(attr.toLowerCase())) {
                        continue;
                    }
                    if (attr == 'class') {
                        val = val.replace(/dynajot-[^\s]*/g, '');
                        val = val.replace(/\s+/g, ' ');
                        val = val.trim();
                        if (val.length === 0) {
                            continue;
                        }
                    }
                    res.attrs[attr] = val;
                }
            }
            res.name = node.tagName.toLowerCase();

            res.children = core.map(dom.getChildNodes(node), function(inner) {
                if (dom.isTextNode(inner)) {
                    return {
                        kind: 'text',
                        value: inner.data
                    };
                } else {
                    return {
                        kind: 'id',
                        value: dom.assign_node_id(root, inner, document_id)
                    };
                }
            });
        }
        if (node == root || !node.parentNode) {
            res.position = null;
        } else {
            res.position = {
                parent: dom.assign_node_id(root, node.parentNode, document_id),
                index: dom.nodeParentIndex(node)[1]
            };
        }
        res.id = dom.assign_node_id(root, node, document_id);
        return res;
    };

    change.updateState = function(root, node, document_id) {
        if (dom.isTextNode(node)) return;
        var id = node.getAttribute('data-id');
        if (id) {
            dom.set_node_id(node, id);
            node.removeAttribute('data-id');
        }
        var state = change.serializeNode(root, node, document_id);
        data.set(node, 'state', state);
        //data.set(node, 'seen', true);
        return state;
    };


    change.mergeDeltas = function(a, b) {
        /* WARNING: b is assumed to be immutable */
        if (b.attrs) {
            if (!a.attrs) {
                a.attrs = {};
            }
            core.dictMerge(a.attrs, b.attrs);
        }
        if (b.position) {
            a.position = core.inherit(b.position);
        }
        if (b.message_id) {
            a.message_id = b.message_id;
        }
        if (b.children) {
            if (a.children && a.children.length > 0) {
                Array.prototype.push.apply(a.children, b.children);
            } else {
                a.children = b.children;
            }
        }
    };

    change.sentenceDiff = function(o, n) {
        var old_parts = core.sentenceSplit(o);
        var new_parts = core.sentenceSplit(n);

        var old_sentences = old_parts[0];
        var old_offsets = old_parts[1];
        var new_sentences = new_parts[0];
        var new_offsets = new_parts[1];
        
        var matcher = new difflib.SequenceMatcher(old_sentences, new_sentences);
        var opcodes = matcher.get_opcodes();

        var res = [];

        for (var i=0; i < opcodes.length; i++) {
            var group = opcodes[i];
            var opcode = opcodes[0];
            var i1 = opcodes[1];
            var i2 = opcodes[2];
            var j1 = opcodes[3];
            var j2 = opcodes[4];
            switch(opcode) {
                case 'replace':
                    res.push({
                        action:'replace',
                        start: old_offsets[i1],
                        end: old_offsets[i2],
                        value: new_sentences.slice(j1, j2).join('')
                    });
                    break;
                case 'delete':
                    res.push({
                        action: 'delete',
                        start: old_offsets[i1],
                        end: old_offsets[i2],
                        value: null
                    });
                    break;
                case 'insert':
                    res.push({
                        action: 'insert',
                        start: old_offsets[i1],
                        end: old_offsets[i2],
                        valie: new_sentences.slice(j1, j2).join('')
                    });
                    break;
            }
        }

        return res;
    };

    change.patch = function(base, deltas) {
        var res = base;
        var offset = 0;
        deltas.sort(function(a, b) {
            return a.start - b.start;
        });
        for (var i=0; i < deltas.length; i++) {
            var delta = deltas[i];
            switch (delta.action) {
                case 'replace':
                    res = res.slice(0, offset + delta.start) +
                        delta.value + res.slice(offset + delta.end);
                    offset += (delta.end - delta.start) + delta.value.length;
                    break;
                case 'delete':
                    res = res.slice(0, offset + delta.start) +
                        res.slice(offset + delta.end);
                    offset -= (delta.end - delta.start);
                    break;
                case 'insert':
                    res = res.slice(0, offset + delta.start) + delta.value +
                        base.slice(offset + delta.start);
                    offset += delta.value.length;
                    break;
            }
        }
        return res;
    };

    /*change.rootDelta = function(state) {
        var res = {};
        res.name = state.name;
        res.attrs = {'+':state.attrs, '-':{}};
        res.children = state.children;
        res.id = state.id;
        res.position = state.position;
        return res;
    };*/

    change.delta = function(old, cur) {
        var res = core.clone(cur);
        res.removed_children = core.filter(old.children, function(child) {
            return core.indexOf(cur.children, child, core.isEqual) == -1;
        });
        res.removed_attrs = {};
        core.each(old.attrs, function(v, k) {
            if (!(k in cur.attrs)) {
                res.removed_attrs[k] = v;
            }
        });
        return res;
    };

    change.nodeTransactions = function(root, nodes, fn) {
        /* @t DOMNode, [DOMNode, ...] (() -> null) -> null */
        core.each(nodes, function(node) {
            data.set(node, 'dirty', true);
        });
        fn();
        core.each(nodes, function(node) {
            change.updateState(root, node);
            data.set(node, 'dirty', false);
        });
    };

    change.nodeTransaction = function(root, node, fn) {
        /* @t DOMNode, DOMNode, (NodeState, DOMNode -> NodeState/null) -> null */
        if (!node.parentNode) { // node not in dom yet
            fn({}, node);
            return;
        }
        data.set(node, 'dirty', true);
        fn(data.get(node, 'state'), node);
        change.updateState(root, node);
        data.set(node, 'dirty', false);
    };

    var stop = false;

    /*setTimeout(function() {
        stop = true;
    }, 5000);*/

    change.changes = function(tree, document_id, delta_callback) {
        /* @t DOMNode, String, (NodeDelta -> null) -> null */
        var node_id = function(node) {
            return dom.assign_node_id(tree, node, document_id);
        };
        var watcher = function(node) {
            if (stop) return;
            if (dom.isTextNode(node)) {
                node = node.parentNode;
            }
            if (!node) return; //orphaned text node
            if (data.get(node, 'dirty')) {
                setTimeout(core.partial(watcher, node), 200);
                return;
            }
            var seen = !!data.get(node, 'seen');
            var prev_state = data.get(node, 'state');
            var cur_state = change.serializeNode(tree, node, document_id);
            if (!core.truthiness(cur_state)) return;
            if (prev_state) {
                /*var delta = change.delta(prev_state, cur_state);
                if (core.truthiness(delta) && !core.hasOnlyKeys(delta, ['name', 'id'])) {
                    delta_callback(cur_state);
                }*/
                if (!core.isEmpty(cur_state) && !core.isEqual(prev_state, cur_state)) {
                    delta_callback(change.delta(prev_state, cur_state));
                }
            } else {
                delta_callback(cur_state);
            }
            data.set(node, 'state', cur_state);
            data.set(node, 'seen', true);
        };
        mutation.onChange(tree, watcher, 200);
    };

    return change;

});
