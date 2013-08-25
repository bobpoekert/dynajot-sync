define([
    "core.js",
    "Data.js",
    "dom.js",
    "difflib.js"
], function(core, data, dom, difflib) {

    var change = {};

    core.serializeNode = function(node) {
        var res = {};
        if (node.nodeType == Node.TEXT_NODE) {
            res.name = 'TEXT';
            res.value = node.innerHTML;
        } else {
            res.attrs = {};
            if (node.hasAttributes()) {
                for (var i=0; i < node.attributes.length; i++) {
                    res.attrs[node.attributes[i].name] = node.attributes[i].value;
                }
            }
            res.name = node.tagName;
        }
        res.position = {
            parent: dom.node_id(node.parentNode),
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

    change.applyDelta = function(base, delta) {
        switch (delta.action) {
            case 'replace':
                return base.slice(0, delta.start) + delta.value + base.slice(delta.end);
            case 'delete':
                return base.slice(0, delta.start) + base.slice(delta.end);
            case 'insert':
                return base.slice(0, delta.start) + delta.value + base.slice(delta.start);
        }
    };

    change.patch = function(base, deltas) {
        return core.reduce(change.applyDelta, deltas, base);
    };

    change.delta = function(old, cur) {
        if (old.name != cur.name) {
            return {}; // tags can't change names, so this should never execute
        } else if (old.name == 'TEXT') {
            if (old.value == cur.value) {
                return {};
            }
            var old_parts = core.sentenceSplit(old.value);
            var cur_parts = core.sentenceSplit(cur.value);
            var matcher = new difflib.SequenceMatcher(
                old_parts[0],
                cur_parts[0]);
            var opcodes = matcher.get_opcodes();
            return {
                value: opcodes
            };
        } else {
            var res = {};
            if (!core.dictIsEqual(cur.position, old.position)) {
                delta.position = cur.position;
            }
            if (!core.dictIsEqual(cur.attrs, old.attrs)) {
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
            return res;
        }
    };


    change.changes = function(tree, delta_callback) {
        core.traverse(tree, function(node) {
            var prev_state = data.get(node, 'state');
            var cur_state = core.serializeNode(node);
            var delta = core.delta(prev_state, cur_state);
            if (!core.truthiness(delta)) {
                delta_callback(delta);
            }
            data.set(node, 'state', cur_state);
        });
    };

    return change;

});
