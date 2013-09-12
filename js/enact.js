define(["core"], function(core) {
    
    var enact = {};

    enact.getNode = function (id) {
        return document.body.querySelector(".dynajot-"+id);
    };

    enact.applyDelta = function (delta) {
        
        var newNode, disnode, parent;

        if (delta.attrs) {
            // + or -  // TODO
        }
        if (delta.create) {
            // create, and maybe insert a new node
            disnode = delta.create;
            newNode = document.createElement(disnode.name);
            newNode.className = disnode.attrs["class"]; // disnode.attrs -> hash;
            if (disnode.children.length > 0) {
                // newNode.appendChild(); // console.log("adding children");
            }

            if (disnode.position) {
                parent = document.body.querySelector(".dynajot-"+disnode.position.parent);
                parent.insertBefore(newNode, parent.children[disnode.position.index]); // handle the index properly?
            }
            // {
            //     "create":
            //     {
            //         "attrs":{"class":"dynajot-7843297729268670-foobar-22"},
            //         "name":"br",
            //         "children":[],
            //         "position":
            //             {"parent":"7843297729268670-foobar-5","index":0}
            //     }
            // }
        }
        if (delta.position) {
            // {"position":{"parent":"7843297729268670-foobar-11","index":2},"id":"7843297729268670-foobar-10"}
            // disnode = enact.getNode(delta.id);
            // parent = enact.getNode(delta.position.parent);
            // parent.insertBefore(disnode, parent.children[delta.position.parent]);

            // move me - for text nodes (at this position, insert)
                // my position relative to the parent
        }
        if (delta.children) {
            // move somebody else
                // position for the children of this node
            var start, end, kind, value, kount, child;

            disnode = enact.getNode(delta.id);
            child = delta.children[0];
            start = child.start; // can be more than one child?
            end = child.end;
            kount = child.value.length;
            while (kount--) {
                newNode = child.value[kount];
                if (newNode.kind === 'text') {
                    // replace the range (start-end) with "value" nodes
                    for (var l=start; l < end; l++) {
                        // disnode.
                    }
                    // alert(newNode.value);
                    disnode.innerHTML = newNode.value; // text - document.createTextNode
                } else if (newNode.kind === 'element') {
                    // lookup the element by id
                        // if already in the dom, remove & add as a child in this position
                        // if not, skip the remove & add (insertBefore / insertAfter)
                }
            }
        }
    };

    return enact;
});