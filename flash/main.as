package {
    import flash.external.ExternalInterface;
    import flash.display.LoaderInfo;
    import flash.net.SecureSocket;
    import flash.events.IOErrorEvent;
    import flash.display.MovieClip;

    class Urlparse {

        public var url:String;
        public var protocol:String;
        public var host:String;
        public var port:int;
        public var path:String;
        public var fragment:String;


        function Urlparse(inp:String) {
            var url_parser = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?');
            var parts = url_parser.exec(url);

            this.url = inp;
            this.protocol = parts[2];
            var host_pieces = parts[4].split(':');
            this.host = host_pieces[0];
            if (host_pieces.length > 1) {
                this.port = parseInt(host_pieces[2]);
            } else {
                this.port = null;
            }
            this.path = parts[5];
            this.fragment = parts[9];

        }

    }

    class Conn {

        var url:Urlparse;
        var callback:String;
        var sock:SecureSocket;
        var connected:Boolean;
        var pumping:Boolean;


        function Conn(url:String, callback:String, callin:String) {
            this.url = Urlparse(url);
            this.callback = callback;
            this.callin = callin;
            this.sock = new SecureSocket();
            this.connect();
        }

        function callback(key:String, val:String) {
            ExternalInerface.call(this.callback, key, val);
        }

        function error(e:Error) {
            this.callback("error", e.toString());
        }

        function onConnect(e:Event) {
            this.callback('connect', '');
        }

        function onData(evt:ProgressEvent) {
            if (this.pumping) {
                this.callback('data', evt.data);
            } else {
                this.callback('headers', evt.data);
                this.pumping = true;
            }
        }

        function writeData(data:String) {
            this.sock.writeUTFBytes(data);
        }

        function connect() {
            this.socket.addEventListener(Event.CONNECT, this.onConnect);
            this.socket.addEventListener(IOErrorEvent.IO_ERROR, this.error);
            this.socket.addEventListener(SecureSocket.securityError, this.error);
            this.socket.addEventListener(SecureSocekt.socketdata, this.onData);
            ExternalInterface.addCallback(this.callin, this.writeData);

            try {
                this.sock.connect(this.url.host, this.url.port || 443);
            } catch (error:Error) {
                this.error(error);
                return;
            }

            this.request();
        }

        function request() {
            this.sock.writeUTFBytes(
                "GET "+this.url.path+" HTTP/1.1\r\n"+
                "Host: "+this.url.host+"\r\n"+
                "User-Agent: FlashSocket/0.1\r\n"+
                "Upgrade: websocket\r\n"+
                "Connection: upgrade\r\n"+
                "Sec-WebSocket-Version: -1\r\n\r\n");
        }

    }

    public class Main extends MovieClip {

        var sockets:Object;

        function Main() {

            var params:Object = LoaderInfo(this.root.loaderInfo).parameters;
            
            ExternalInterface.addCallback("connect", this.connect);
            ExternalInterface.call(params.onload);

        }

        public function connect(url:String, callback:String) {
            new Conn(url, callback);
        }

    }
}
