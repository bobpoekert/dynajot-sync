define(["dom", "core"], function(dom, core) {
    module('Dom (js/dom.js)');

    var test_html = '<header id="header">\n<h1>todos</h1>\n<input id="new-todo" placeholder="What needs to be done?" autofocus="">\n</header>\n<section style="display: block;" id="main">\n<input id="toggle-all" type="checkbox">\n<label for="toggle-all">Mark all as complete</label>\n<ul id="todo-list"><li data-id="1381355142223" class=""><div class="view"><input class="toggle" type="checkbox"><label>todo1</label><button class="destroy"></button></div></li><li data-id="1381355144846" class=""><div class="view"><input class="toggle" type="checkbox"><label>todo2</label><button class="destroy"></button></div></li></ul>\n</section>\n<footer style="display: block;" id="footer">\n<span id="todo-count"><strong>2</strong> items left</span>\n<ul id="filters">\n<li>\n<a class="selected" href="#/">All</a>\n</li>\n<li>\n<a href="#/active">Active</a>\n</li>\n<li>\n<a href="#/completed">Completed</a>\n</li>\n</ul>\n<button style="display: none;" id="clear-completed"></button>\n</footer>';
    var inserted_test_html = '<header id="header"><div></div>\n<h1>todos</h1>\n<input id="new-todo" placeholder="What needs to be done?" autofocus="">\n</header>\n<section style="display: block;" id="main">\n<input id="toggle-all" type="checkbox">\n<label for="toggle-all">Mark all as complete</label>\n<ul id="todo-list"><li data-id="1381355142223" class=""><div class="view"><input class="toggle" type="checkbox"><label>todo1</label><button class="destroy"></button></div></li><li data-id="1381355144846" class=""><div class="view"><input class="toggle" type="checkbox"><label>todo2</label><button class="destroy"></button></div></li></ul>\n</section>\n<footer style="display: block;" id="footer">\n<span id="todo-count"><strong>2</strong> items left</span>\n<ul id="filters">\n<li>\n<a class="selected" href="#/">All</a>\n</li>\n<li>\n<a href="#/active">Active</a>\n</li>\n<li>\n<a href="#/completed">Completed</a>\n</li>\n</ul>\n<button style="display: none;" id="clear-completed"></button>\n</footer>';
    var test_tagnames = [
        'div', 'header', 'h1', 'input', 'section', 'input', 'label',
        'ul', 'li', 'div', 'input', 'label', 'button', 'li', 'div',
        'input', 'label', 'button', 'footer', 'span', 'strong', 'ul',
        'li', 'a', 'li', 'a', 'li', 'a', 'button'
    ];

    var dom_target = document.createElement('div');
    dom_target.style.display = 'none';
    document.body.appendChild(dom_target);

    var test_dom = (function() {
        var test = document.createElement('div');
        test.innerHTML = test_html;
        return function(fn) {
            var res = test.cloneNode(true);
            dom_target.appendChild(res);
            // fn(res);
            // dom_target.removeChild(res);
            return res;
        };
    }());

    var test_dom2 = (function () {
        var test = document.createElement('div');
        test.innerHTML = inserted_test_html;
        return function() {
            return test.cloneNode(true);
        };
    }());

    var test_dom_text = (function () {
        var test = document.createElement('div');
        test.innerHTML = '<div>textnode1<input id="elem1">textnode2<section id="elem2">div2</section></div>';
        return function () {
            return test.cloneNode(true);
        };
    }());


    test("traverse", function () {
        expect(test_tagnames.length);
        var idx = 0;
        var checker = function(node) {
            var target_name = test_tagnames[idx];
            ok(node.tagName.toLowerCase() == target_name);
            idx++;
        };

        dom.traverse(test_dom(), checker);
    });

    var tagnames = ['div', 'ul', 'table', 'li', 'span'];
    var fillWithRandomCrap = function(parent) {
        var n_children = Math.floor(Math.random() * 10);
        while (n_children > 0) {
            var new_child = document.createElement(randomChoice(tagnames));
            if (Math.random() < 0.02) {
                fillWithRandomCrap(new_child);
            }
            for (var i=Math.random() * 10; i > 0; i--) {
                new_child.setAttribute(randomString().toLowerCase(), randomString());
            }
            parent.appendChild(new_child);
            n_children--;
        }
    };

    var randomNode = function() {
        if (Math.random() > 0.5) {
            var res = document.createElement(randomChoice(tagnames));
            fillWithRandomCrap(res);
            return res;
        } else {
            return document.createTextNode(randomString());
        }
    };

    test("nodeParentIndex", function () {
        for (var i=0; i < 100; i++) {
            var parent = document.createElement(randomChoice(tagnames));
            var child = document.createElement(randomChoice(tagnames));
            var actual_index = Math.floor(Math.random() * 10);
            for (var j=0; j < actual_index; j++) {
                parent.appendChild(randomNode());
            }
            parent.appendChild(child);
            var extra_elements = Math.floor(Math.random() * 10);
            while (extra_elements > 0) {
                parent.appendChild(randomNode());
                extra_elements--;
            }
            var res = dom.nodeParentIndex(child);
            equal(res[0], parent);
            equal(res[1], actual_index);
        }
    });

    test("elementParentIndex", function () {
        var td = test_dom2();
        deepEqual(
            dom.elementParentIndex(td.getElementsByTagName("input")[0]),
            [td.getElementsByTagName("header")[0], 2]);
    });

    test("isTextNode", function () {
        ok(!dom.isTextNode(document.createElement("div")));
        ok(dom.isTextNode(document.createTextNode("true")));
    });

    test("setIdClass", function () {
        var td = test_dom();
        var header = td.getElementsByTagName("header")[0];
        dom.setIdClass(header, "testid");
        equal(header.getAttribute("class"), 'dynajot-testid');
        dom.setIdClass(header, "bogusasdasdasdasd");
        equal(header.getAttribute("class"), 'dynajot-bogusasdasdasdasd');
    });

    test("toFragment", function () {
        var nodes = [];
        for (var i=0; i < 20; i++) {
            nodes.push(document.createElement('div'));
        }
        var frag = dom.toFragment(nodes);
        equal(frag.nodeType, Node.DOCUMENT_FRAGMENT_NODE);
        deepEqual(core.toArray(frag.childNodes), nodes);
    });

    test("getChildNodes", function () {
        ok(true);
    });

    test("spliceNodes", function () {
        var divs = [];
        for(var i=0; i<10; i++) {
            var div = document.createElement("div");
            div.setAttribute('id', i);
            divs.push(div);
        }

        var copyNodes = function(nodes) {
            return core.map(nodes, function(node) {
                return node.cloneNode(true);
            });
        };

        var nodeArrayHTML = function(nodes) {
            return core.map(nodes, function(node) {
                return node.innerHTML;
            }).join('');
        };

        var nodesEqual = function(a, b, docstring) {
            equal(nodeArrayHTML(a), nodeArrayHTML(b), docstring);
        };

        var root = document.createElement('div');
        root.setAttribute('id', 'root');
        dom.spliceNodes(root, 0, 0, copyNodes(divs.slice(0, 3)));
        nodesEqual(dom.getChildNodes(root), divs.slice(0, 3), "Append into nothing");
        
        dom.spliceNodes(root, 0, 1, []);
        var children = dom.getChildNodes(root);
        nodesEqual(children, copyNodes(divs.slice(1,3)), "Remove from beginning");

        children = dom.getChildNodes(root);
        // console.log('a');
        dom.spliceNodes(root, 0, 0, divs);
        // console.log('b');
        nodesEqual(dom.getChildNodes(root), copyNodes(divs.concat(children)), "Prepend");

        children = dom.getChildNodes(root);
        dom.spliceNodes(root, children.length, children.length, divs);
        nodesEqual(dom.getChildNodes(root), copyNodes(children.concat(divs)), "Append");

        children = dom.getChildNodes(root);
        dom.spliceNodes(root, 2, 3, []);
        nodesEqual(children, copyNodes(divs.slice(0,2)), "Remove from middle");

        children = dom.getChildNodes(root);
        dom.spliceNodes(root, 5, children.length, []);
        nodesEqual(dom.getChildNodes(root), copyNodes(children.slice(5)), "Remove from end");
    });

    test("yankNode", function () {
        var td = test_dom();
        var header = td.getElementsByTagName("header")[0];
        dom.yankNode(header);
        ok(!header.parentNode);
    });

    var randomChoice = function(lst) {
        return lst[Math.floor(Math.random() * lst.length)];
    };

    var randomString = function() {
        var res = [];
        var cnt = Math.random() * 20;
        for (var i=0; i < cnt; i++) {
            res.push(String.fromCharCode(Math.floor(Math.random() * 26 + 65)));
        }
        return res.join('');
    };

    var randomDict = function() {
        var res = {};
        var cnt = Math.random() * 20;
        for (var i=0; i < cnt; i++) {
            res[randomString().toLowerCase()] = randomString();
        }
        return res;
    };

    var repeatRandom = function(v) {
        var cnt = Math.floor(Math.random() * 20);
        var res = [];
        for (var i=0; i < cnt; i++) {
            res.push(v());
        }
        return res;
    };


    var newNode = function() {
        var res = document.createElement(randomChoice(['div', 'span', 'label', 'input', 'li', 'pre']));
        for (var i=Math.random() * 10; i > 0; i--) {
            res.setAttribute(randomString().toLowerCase(), randomString());
        }
        for (i=Math.random() * 10; i > 0; i--) {
            res.appendChild(document.createTextNode(randomString()));
        }
        return res;
    };

    test("insertNodeAt - stress", function () {
        var root = document.createElement('div');
        root.style.display = 'none';
        document.body.appendChild(root);

        var start_time = Date.now();
        //var nodes = [root];
        while (Date.now() - start_time < 1000) {
            var node = newNode();
            //fillWithRandomCrap(node);
            //var parent = randomChoice(nodes);
            var idx = Math.floor(Math.random() * dom.getChildNodes(root).length);
            dom.insertNodeAt(root, node, idx);
            equal(dom.nodeParentIndex(node)[1], idx);
            //nodes.push(node);
        }
    });

    test("insertNodeAt", function () { // node, not element
        var td = test_dom();
        var newNode = document.createElement("div");
        newNode.setAttribute('id', 'lookiehere');
        dom.insertNodeAt(td, newNode, 1);
        equal(newNode.parentNode, td);
        deepEqual(dom.elementParentIndex(newNode), [td, 1]);

        // text nodes
    });

    test("isChildOf", function () {
        var td = test_dom();
        var header = td.getElementsByTagName("header")[0];
        ok(dom.isChildOf(td, header));
        ok(!dom.isChildOf(td, document.getElementsByTagName("footer")[0]));
    });

    test("set_node_id", function () {
        var td = test_dom();
        var header = td.getElementsByTagName("header")[0];
        dom.set_node_id(header, "bogus");
        ok(dom.get_node_id(header) === "bogus");
    });

    test("assign_node_id", function () {
        var td = test_dom();
        var node = td.getElementsByTagName("header")[0];
        ok(dom.assign_node_id(td, td, "domtest") === "_root");
        dom.assign_node_id(td, node, "domtest");
        var id = dom.get_node_id(node);
        ok(id);
        dom.assign_node_id(td, node, "domtest");
        ok(dom.get_node_id(node) == id);
    });

    test("assign_all_ids", function () {
        var td = test_dom();
        dom.assign_all_ids(td, td, "domtest");
        dom.traverse(td, function(node) {
            if (node == td) return;
            ok(dom.get_node_id(node));
        });
    });

    test("get_node_id", function () {
       var td = test_dom();
        var header = td.getElementsByTagName("header")[0];
        dom.set_node_id(header, "bogus");
        ok(dom.get_node_id(header) === "bogus");
    });

});