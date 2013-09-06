define(["core"], function(core) {
    
    var enact = {};

    enact.apply_delta = function (delta) {
        
        var newNode, disnode;

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
                var parent = document.body.querySelector(".dynajot-"+disnode.position.parent);
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
            // move me - for text nodes (at this position, insert)
                // my position relative to the parent
                // console.log(dom_id);
        }
        if (delta.children) {
            // move somebody else
                // position for the children of this node
            disnode = document.body.querySelector(".dynajot-"+delta.id);
            
            var start, end, kind, value, kount, child;
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