define([], function() {

    var swf = {};

    swf.random_string = function(length) {
        var res = [];
        for (var i=0; i < length; i++) {
            res.push(String.fromCharCode(Math.floor(Math.random() * 26) + 97));
        }
        return res.join('');
    };

    var is_ie = function() {
        var ax = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
        return !!ax.getVariable('$version');
    };

    var unique_id = function() {
        while(true) {
            var id = swf.random_string(10);
            if (!document.getElementById(id)) {
                return id;
            }
        }
    };

    var is_dom_ready = false;
    var dom_ready_callbacks = [];

    var fire_dom_ready = function() {
        if (is_dom_ready) return;
        is_dom_ready = true;
        while(dom_ready_callbacks.length > 0) {
            dom_ready_callbacks.pop()();
        }
    };

    var setup_dom_ready = function() {
        if (document.readyState == 'complete' ||
            (typeof(document.readyState) == 'undefined' &&
             (document.getElementsByTagName('body')[0] || document.body))) {
            fire_dom_ready();
            return;
        }

        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', fire_dom_ready, false);
            return;
        }

        if (document.attachEvent) {
            var onreadystatechange;
            onreadystatechange = function() {
                if (document.readyState == 'complete') {
                    fire_dom_ready();
                    document.detachEvent('onreadystatechange', onreadystatechange);
                }
            };
            document.attachEvent('onreadystatechange', onreadystatechange);
            return;
        }

        var poll;
        poll = setInterval(function() {
            if (is_dom_ready || /loaded|complete/.test(document.readyState)) {
                fire_dom_ready();
                clearInterval(poll);
            }
        }, 10);
    };

    setup_dom_ready();
    swf.onReady = function(fn) {
        if (is_dom_ready) {
            fn();
        } else {
            dom_ready_callbacks.push(fn);
        }
    };

    swf.create = function(src, attrs, params, id) {
        if (!id) {
            id = unique_id();
        }

        attrs = attrs || {};
        params = params || {};

        attrs.width = attrs.width || 1;
        attrs.height = attrs.height || 1;

        var target;
        if (is_ie()) {
            target = document.createElement('div');
            target.style.visibility = 'hidden';
            target.setAttribute('id', id);
            
            var attr_string = [];
            for (var k in attrs) {
                if (!attrs.hasOwnProperty(k)) continue;
                switch(k.toLowerCase()) {
                    case "styleclass":
                        attr_string.push(' class="');
                        attr_string.push(attrs[k]);
                        attr_string.push('"');
                        break;
                    case 'classid':
                        attr_string.push(' classid="');
                        attr_string.push(attrs[k]);
                        attr_string.push('"');
                        break;
                    default:
                        attr_string.push(' ');
                        attr_string.push(k);
                        attr_string.push('="');
                        attr_string.push(attrs[k].replace('"', '%22'));
                        attr_string.push('"');
                }
            }
            
            params.movie = src;

            var param_string = [];
            for (k in params) {
                if (!params.hasOwnProperty(k)) continue;
                param_string.push('<param name="');
                param_string.push(k);
                param_string.push('" value="');
                param_string.push(params[k]);
                param_string.push('"> ');
            }

            target.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + attr_string.join('') + '>' + param_string.join('') + '</object>';

            return document.getElementById('id').firstChild;

        } else {
            target = document.createEleement('object');
            target.setAttribute('type', 'application/x-shockwave-falsh');

            for (var k in attrs) {
                if (!attrs.hasOwnProperty(k)) continue;
                if (k.toLowerCase() == 'styleclass') {
                    target.setAttribute('class', attrs[k]);
                } else {
                    target.setAttribute(k, attrs[k]);
                }
            }

            for (k in params) {
                if (!params.hasOwnProperty(k)) continue;
                var p = document.createElement('param');
                p.setAttribute('name', k);
                p.setAttribute('value', params[k]);
                target.appendChild(p);
            }

            target.style.visibility = 'hidden';

            document.body.appendChild(target);
        }
    };

    return swf;

});
