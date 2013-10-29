define(["dom", "change"], function(dom, change) {

    var utils = {};

    utils.randomChoice = function(lst) {
        return lst[Math.floor(Math.random() * lst.length)];
    };

    utils.updateTreeState = function(root, document_id) {
        dom.traverse(root, function(node) {
            change.updateState(root, node, document_id || 'document_id');
        });
    };

    utils.randomString = function() {
        var res = [];
        var cnt = Math.random() * 20;
        for (var i=0; i < cnt; i++) {
            res.push(String.fromCharCode(Math.floor(Math.random() * 26 + 65)));
        }
        return res.join('');
    };

    utils.randomDict = function() {
        var res = {};
        var cnt = Math.random() * 20;
        for (var i=0; i < cnt; i++) {
            res[utils.randomString().toLowerCase()] = utils.randomString();
        }
        return res;
    };

    utils.repeatRandom = function(v) {
        var cnt = Math.floor(Math.random() * 20);
        var res = [];
        for (var i=0; i < cnt; i++) {
            res.push(v());
        }
        return res;
    };

    var id_ctr = 0;
    utils.newNode = function() {
        return {
            id: (id_ctr++).toString(),
            children: utils.repeatRandom(function() {
                return {'kind':'text', 'value':utils.randomString()};
            }),
            name: utils.randomChoice(['div', 'input', 'span', 'button', 'pre', 'label']),
            attrs: utils.randomDict(),
            position: {
                parent: '_root',
                index: id_ctr
            }
        };
    };
   
    utils.newDomNode = function() {
        var res = document.createElement(utils.randomChoice(['div', 'span', 'label', 'input', 'li', 'pre']));

        for (var i=Math.random() * 10; i > 0; i--) {
            res.setAttribute(utils.randomString().toLowerCase(), utils.randomString());
        }
        for (i=Math.random() * 10; i > 0; i--) {
            res.appendChild(document.createTextNode(utils.randomString()));
        }
        return res;
    };

    utils.pickRandomElement = function(root, test) {
        var res;
        dom.traverse(root, function(node) {
            if (node.nodeType == Node.ELEMENT_NODE && test ? test(node) : true) {
                res = node;
                if (Math.random() < 0.1) return false;
            }
        });
        return res;
    };
    
    var tagnames = ['div', 'ul', 'table', 'li', 'span'];
    utils.fillWithRandomCrap = function(parent) {
        var n_children = Math.floor(Math.random() * 10);
        while (n_children > 0) {
            var new_child = document.createElement(utils.randomChoice(tagnames));
            if (Math.random() < 0.02) {
                utils.fillWithRandomCrap(new_child);
            }
            for (var i=Math.random() * 10; i > 0; i--) {
                new_child.setAttribute(utils.randomString().toLowerCase(), utils.randomString());
            }
            parent.appendChild(new_child);
            n_children--;
        }
    };

    utils.randomElement = function() {
        var res = document.createElement(utils.randomChoice(tagnames));
        utils.fillWithRandomCrap(res);
        return res;
    };

    return utils;
});
