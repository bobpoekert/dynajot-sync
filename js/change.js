define([
    "core",
    "Data",
    "dom",
    "difflib",
    "mutation",
], function(core, data, dom, difflib, mutation) {

    var change = {};

    change.serializeNode = function(node, document_id) {
        if (!node) {
            return {};
        }
        var res = {};
        if (core.isTextNode(node)) {
            return change.serializeNode(node.parent, document_id);
        } else {
            res.attrs = {};
            if (node.hasAttributes()) {
                for (var i=0; i < node.attributes.length; i++) {
                    res.attrs[node.attributes[i].name] = node.attributes[i].value;
                }
            }
            res.name = node.tagName;
            res.children = core.map(node.childNodes, function(node) {
                if (core.isTextNode(node)) {
                    return {
                        kind: 'text',
                        value: node.data
                    };
                } else {
                    return {
                        kind: 'id',
                        value: dom.node_id(node, document_id)
                    };
                }
            });
        }
        res.position = {
            parent: dom.node_id(node.parentNode, document_id),
            index: dom.parentIndex(node)[1]
        };
        return res;
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

    change.delta = function(old, cur) {
        if (!cur) {
            return {};
        }
        if (old.name != cur.name) {
            return {}; // tags can't change names, so this should never execute
        } else {
            var res = {};

            if (!core.isEqual(cur.position, old.position)) {
                res.position = cur.position;
            }
            if (!core.isEqual(cur.attrs, old.attrs)) {
                res.attrs = {
                    '+': {},
                    '-': {}
                };
                for (var k in old.attrs) {
                    if (old.attrs.hasOwnProperty(k) &&
                        !cur.attrs.hasOwnProperty(k)) {
                        res.attrs['-'][k] = old.attrs[k];
                    }
                }
                for (var k in cur.attrs) {
                    if (cur.attrs.hasOwnProperty(k) &&
                        cur.attrs[k] != old.attrs[k]) {
                        res.attrs['+'][k] = cur.attrs[k];
                    }
                }
            }
            if (!core.isEqual(cur.children, old.children)) {
                res.children = cur.children;

                if (false) {
                var serializer = function(val) {
                    return val.kind+':'+val.value;
                };
                var matcher = new difflib.SequenceMatcher(
                    core.map(cur.children, serializer),
                    core.map(old.children, serializer));
                var opcodes = matcher.get_opcodes();

                res.children = core.map(
                    opcodes, core.splat(function(opcode, i1, i2, j1, j2) {
                        switch(opcode) {
                            case 'insert':
                            case 'replace':
                                return {
                                   start: i1,
                                   end: i2,
                                   value: cur.children.slice(j1, j2)
                                };
                            case 'delete':
                                return {
                                    start: i1,
                                    end: i2,
                                    value: []
                                };
                        }

                    })
                );
                }
            }

            return res;
        }
    };

    change.changes = function(tree, document_id, delta_callback) {
        mutation.onChange(tree, function(node) {
            if (core.isTextNode(node)) {
                node = node.parentNode;
            }
            var prev_state = data.get(node, 'state');
            var cur_state = change.serializeNode(node, document_id);
            if (prev_state) {
                var delta = change.delta(prev_state, cur_state);
                if (core.truthiness(delta)) {
                    delta_callback(delta);
                }
            } else {
                delta_callback({"create":cur_state});
            }
            data.set(node, 'state', cur_state);
        });
    };

    return change;

});
