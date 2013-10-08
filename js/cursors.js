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
        console.log($newCursor);
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
        console.log(["Sending", msg]);
        // channel.send(JSON.stringify(msg));
        cursors.send_fn(msg);
    };

    // user looks like {'id': 1337, 'name': 'blah'};
    cursors.init = function (send_fn) {
        cursors.send_fn = send_fn;

        console.log("initted");
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

        console.log("[socket] Opened");
        // get all cursors in the channel and init their divs? not necessary

        var v = {'cursors': {'enter': true}, 'user': cursors.user};
        sendMessage(v);

        $("body").on("mousemove", core.throttle(function (e) {
            var v = {'cursors': {'mousemove': {'coords': [e.pageX, e.pageY]}}, 'user': {'name': cursors.user.name, 'id': cursors.user.id}};
            console.log("Sending ", v);
            sendMessage(v);
        }, 75));
    };

    cursors.updateCursors = function (msgEvent) {
        var msg = JSON.parse(msgEvent.data);
        console.log(msg);
        var coords, posX, posY, msgv, $newCursor, $userMouse;

        if (msg.kind === 'cursors') {
            // a person joined the document
            msgv = msg.value;

            if (msgv.action.enter) {
                //  another mouse to the document with their id
                console.log("someone joined");
                $newCursor = ui.createCursor(msgv.user);
                console.log(participants);
                participants[msgv.user.id] = $newCursor; // should retain a reference to the cursor
            }
            //   a person left the document
            if (msgv.action.leave) {
                // remove the mouse from the document
                console.log("elvis has left the building");
                ui.removeUserCursor(msgv.user);
                delete participants[msgv.user.id];
            }
            //   a person moved their mouse
                // move the cursor div, with a closure'd fadeout
            console.log("[Socket] message received!");
            console.log(participants);
            if (msgv.action.mousemove) {
                console.log(msgv.action);
                // if the person isn't tracked yet add their cursor to the dom
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