define(["dom", "core"], function(dom, core) {
    module('Dom (js/dom.js)');

    var test_html = '<header id="header">\n<h1>todos</h1>\n<input id="new-todo" placeholder="What needs to be done?" autofocus="">\n</header>\n<section style="display: block;" id="main">\n<input id="toggle-all" type="checkbox">\n<label for="toggle-all">Mark all as complete</label>\n<ul id="todo-list"><li data-id="1381355142223" class=""><div class="view"><input class="toggle" type="checkbox"><label>todo1</label><button class="destroy"></button></div></li><li data-id="1381355144846" class=""><div class="view"><input class="toggle" type="checkbox"><label>todo2</label><button class="destroy"></button></div></li></ul>\n</section>\n<footer style="display: block;" id="footer">\n<span id="todo-count"><strong>2</strong> items left</span>\n<ul id="filters">\n<li>\n<a class="selected" href="#/">All</a>\n</li>\n<li>\n<a href="#/active">Active</a>\n</li>\n<li>\n<a href="#/completed">Completed</a>\n</li>\n</ul>\n<button style="display: none;" id="clear-completed"></button>\n</footer>';
    var test_tagnames = [
        'div', 'header', 'h1', 'input', 'section', 'input', 'label',
        'ul', 'li', 'div', 'input', 'label', 'button', 'li', 'div',
        'input', 'label', 'button', 'footer', 'span', 'strong', 'ul',
        'li', 'a', 'li', 'a', 'li', 'a', 'button'
    ];

    var test_dom = (function() {
        var test = document.createElement('div');
        test.innerHTML = test_html;
        return function() {
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

    test("nodeParentIndex", function () {
        var td = test_dom();
        deepEqual(
            dom.nodeParentIndex(td.getElementsByTagName("input")[0]),
            [td.getElementsByTagName("header")[0], 3]);
    });

    test("elementParentIndex", function () {
        var td = test_dom();
        deepEqual(
            dom.elementParentIndex(td.getElementsByTagName("input")[0]),
            [td.getElementsByTagName("header")[0], 1]);
    });

    test("isTextNode", function () {
        ok(!dom.isTextNode(document.createElement("div")));
        ok(dom.isTextNode(document.createTextNode("true")));
    });

    test("setIdClass", function () {
        var td = test_dom();
        var header = td.getElementsByTagName("header")[0];
        dom.setIdClass(header, "testid");
        equal(header.getAttribute("class"), ' dynajot-testid');
        dom.setIdClass(header, "bogusasdasdasdasd");
        equal(header.getAttribute("class"), ' dynajot-bogusasdasdasdasd');
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
        console.log('a');
        dom.spliceNodes(root, 0, 0, divs);
        console.log('b');
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

    test("insertNodeAt", function () { // node, not element
        var td = test_dom();
        var newNode = document.createElement("div");
        dom.insertNodeAt(td, newNode, 1);
        equal(newNode.parentNode, td);
        deepEqual(dom.elementParentIndex(newNode), [td, 1]);
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