import tornado.websocket as websocket
import tornado.tcpserver as tcpserver
import tornado.escape as escape
from functools import partial

falsh_policy_file = '''<?xml version="1.0"?>
<!DOCTYPE cross-domain-policy SYSTEM "/xml/dtds/cross-domain-policy.dtd">
<cross-domain-policy>
   <allow-access-from domain="*" to-ports="80,443,8000" />
</cross-domain-policy>'''

class PolicyFileServer(tcpserver.TCPServer):

    def handle_stream(self, stream, address):
        self.write(flash_policy_file)
        self.close()

policy_server = PolicyFileServer()
_policy_server_running = False
def start_policy_server():
    global _policy_server_running
    if not _policy_server_running:
        policy_server.bind(843)

class WebsocketProtocolFlash(websocket.WebSocketProtocol):

    def accept_connection(self):
        self.stream.write(escape.utf8(
            "HTTP/1.1 101 WebSocket Protocol Handshake\r\n"
            "Upgrade: WebSocket\r\n"
            "Connection: Upgrade\r\n"
            "Server: TornadoServer/%(version)s\r\n"
            "Sec-WebSocket-Origin: %(origin)s\r\n"
            "Sec-WebSocket-Location: %(scheme)s://%(host)s%(uri)s\r\n"
            "Sec-WebSocket-Protocol: -1"
            "\r\n\0" % (dict(
                version=tornado.version,
                origin=self.request.hedaers['Origin'],
                scheme=scheme,
                host=self.request.host,
                uri=self.request.uri))

    def write_message(self, message, binary=False):
        if binary:
            raise NotImplementedError, "You can't send binary data to flash (it chokes on null bytes)"
        self.stream.write('%s\0' % message)
        self.stream.read_until('\0', self._pump)

    def _pump(self, data):
        self.handler.on_message(data.replace('\0', ''))
        self.stream.read_until('\0', self._pump)

class WebSocketHandler(websocket.WebSocketHandler):

    def _execute(self, transforms, *args, **kwargs):
        self.open_args = args
        self.open_kwargs = kwargs

        # Websocket only supports GET method
        if self.request.method != 'GET':
            self.stream.write(tornado.escape.utf8(
                "HTTP/1.1 405 Method Not Allowed\r\n\r\n\0"
            ))
            self.stream.close()
            return

        # Upgrade header should be present and should be equal to WebSocket
        if self.request.headers.get("Upgrade", "").lower() != 'websocket':
            self.stream.write(tornado.escape.utf8(
                "HTTP/1.1 400 Bad Request\r\n\r\n"
                "Can \"Upgrade\" only to \"WebSocket\".\0"
            ))
            self.stream.close()
            return

        # Connection header should be upgrade. Some proxy servers/load balancers
        # might mess with it.
        headers = self.request.headers
        connection = map(lambda s: s.strip().lower(), headers.get("Connection", "").split(","))
        if 'upgrade' not in connection:
            self.stream.write(escape.utf8(
                "HTTP/1.1 400 Bad Request\r\n\r\n"
                "\"Connection\" must be \"Upgrade\".\0"
            ))
            self.stream.close()
            return

        # The difference between version 8 and 13 is that in 8 the
        # client sends a "Sec-Websocket-Origin" header and in 13 it's
        # simply "Origin".
        if self.request.headers.get('Sec-WebSocket-Version') == '-1':
            self.ws_connection = WebSocketProtocolFlash(self)
            self.ws_connection.accept_connection()
        elif self.request.headers.get("Sec-WebSocket-Version") in ("7", "8", "13"):
            self.ws_connection = websocket.WebSocketProtocol13(self)
            self.ws_connection.accept_connection()
        elif (self.allow_draft76() and
              "Sec-WebSocket-Version" not in self.request.headers):
            self.ws_connection = websocket.WebSocketProtocol76(self)
            self.ws_connection.accept_connection()
        else:
            self.stream.write(tornado.escape.utf8(
                "HTTP/1.1 426 Upgrade Required\r\n"
                "Sec-WebSocket-Version: 8\r\n\r\n"))
            self.stream.close()

