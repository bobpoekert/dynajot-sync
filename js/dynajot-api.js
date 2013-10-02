// fake javascript file that loads the require JS files
requirejs.config({
    baseUrl: '/js'
});

$.fn.collab = function () {
    var myID = $(this).attr("id");
    requirejs(["sync"], function(sync) {
        sync.sync(document.getElementById(myID));
    });
    return $(this);
};