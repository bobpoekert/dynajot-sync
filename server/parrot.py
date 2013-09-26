import tornado.websocket as websocket
import tornado.web as web
from functools import partial

import os, hashlib
import json

base_path = os.path.dirname(os.path.abspath(__file__))
def relpath(p):
    return os.path.join(base_path, p)

def random_id():
    return hashlib.sha1(os.urandom(20)).hexdigest()

documents = {}

class ParrotHandler(websocket.WebSocketHandler):

    def open(self, document):
        if not document:
            new_id = None
            while (not new_id) or (new_id in documents):
                new_id = random_id()
            document = new_id
            self.write_message({'kind': 'document_id', 'value':document})
        if document in documents:
            documents[document].add(self)
        else:
            documents[document] = set([self])
        self.document = document
        self.peers = documents[document]

    def on_message(self, blob):
        print blob
        message = json.loads(blob)
        for recipient in self.peers:
            if recipient != self:
                recipient.write_message({'kind': 'message', 'value': message})

    def on_close(self):
        self.peers.remove(self)
        if not self.peers:
            del documents[self.document]

app = web.Application([
    ('/doc/(.*)', ParrotHandler),
    ('/(.*)', web.StaticFileHandler, {'path':relpath('..')})
], debug=True)

if __name__ == '__main__':
    import os
    from tornado.ioloop import IOLoop
    port = int(os.environ.get('PORT', 5000))
    app.listen(port)
    print port
    IOLoop.instance().start()
