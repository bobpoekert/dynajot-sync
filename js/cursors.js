define(["core", "ids", "dom"], function(core, ids, dom) {

    var cursors = {};
    cursors.id = "dj-cursor-stable";
    cursors.user = {};
    cursors.send_fn = null;

    var utils = {};

    utils.generateUUID = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    var ui = {};

    ui.createCursor = function (user) {
        var newHTML = ['<div id="dj-presence-mouse-'+user.id+'" class="dj-mouse">',
        '<div class="dj-filler-wrap">',
        '<div class="dj-filler">'+user.name+'</div>',
        '</div>',
        '</div>'].join("");
        var $newCursor = $("div");
        $newCursor.html(newHTML);
        $("#"+cursors.id).append($newCursor);
        // console.log($newCursor);
        return $newCursor;
    };

    ui.getOrCreateCursor = function (user) {
        $cursor = participants[user.id];
        if ($cursor) {
            return $cursor;
        } else {
            $cursor = ui.createCursor(user);
            participants[user.id] = $cursor;
            return $cursor;
        }
    };

    // id -> cached jquery selector
    var participants = {};

    var sendMessage = function (msg) {
        cursors.send_fn(msg);
    };

    cursors.init = function (send_fn) {
        cursors.send_fn = send_fn;

        var djdiv = document.createElement("div");
        djdiv.id = cursors.id;
        djdiv.css = "position: absolute; top:0; left:0;";
        // TODO: add a class here that prevents syncing of cursors
        document.body.appendChild(djdiv);

        var username = prompt("What is your name?");
        cursors.user = {
            'name': username,
            'id': utils.generateUUID()
        };

        var v = {'mouse_position': {'enter': true}, 'user': cursors.user};
        sendMessage({'kind': 'mouse_position', 'value': v});

        $("body").on("mousemove", core.throttle(function (e) {
            var v = {'mouse_position': {'mousemove': {'coords': [e.pageX, e.pageY]}}, 'user': {'name': cursors.user.name, 'id': cursors.user.id}};
            sendMessage({'kind': 'mouse_position', 'value':v});
        }, 75));
    };

    cursors.updateCursors = function (msgEvent) {
        var msg = JSON.parse(msgEvent.data);
        var coords, posX, posY, msgv, $newCursor, $userMouse;

        if (msg.kind === 'mouse_position') {
            msgv = msg.value;

            if (msgv.action.enter) {
                $newCursor = ui.createCursor(msgv.user);
                participants[msgv.user.id] = $newCursor; // should retain a reference to the cursor
            }
            if (msgv.action.leave) {
                ui.removeUserCursor(msgv.user);
                delete participants[msgv.user.id];
            }
            if (msgv.action.mousemove) {
                coords = msgv.action.mousemove.coords;
                posX = coords[0];
                posY = coords[1];

                $userMouse = ui.getOrCreateCursor(msgv.user);

                $userMouse.css({
                    'top': posY,
                    'left': posX
                });
                $userMouse.find(".dj-filler").text(msgv.user.name);
            }
        }
    };

    return cursors;
});