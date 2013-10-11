import tornado.websocket as websocket
import tornado.web as web
from functools import partial

import os, hashlib
import json

import patch

base_path = os.path.dirname(os.path.abspath(__file__))
def relpath(p):
    return os.path.join(base_path, p)

def random_id():
    return hashlib.sha1(os.urandom(20)).hexdigest()

documents = {}
document_trees = {}
document_counters = {}

class DocumentStateHandler(web.RequestHandler):

    def get(self, document_id):
        try:
            self.write(document_trees[document_id].to_html())
        except KeyError:
            self.send_error(404)

class ParrotHandler(websocket.WebSocketHandler):

    def open(self, document):
        if not document:
            new_id = None
            while (not new_id) or (new_id in documents):
                new_id = random_id()
            document = new_id
            self.write_message({'kind': 'document_id', 'value':document})

        if document in document_trees:
            tree = document_trees[document]
            self.write_message({
                'kind':'document_state',
                'value': tree.to_html()})
        else:
            document_trees[document] = patch.Document()
            self.write_message({
                'kind':'document_state',
                'value': False})

        if document in documents:
            documents[document].add(self)
        else:
            documents[document] = set([self])

        print document, document_trees.keys()

        self.document = document
        self.peers = documents[document]
        self.tree = document_trees[document]

    def on_message(self, blob):
        print blob
        message = json.loads(blob)
        counter = document_counters.get(self.document, 0)
        document_counters[self.document] = counter + 1

        if message["kind"] == "delta":
            self.tree.apply_delta(message["value"])

        message['global_timestamp'] = counter

        for recipient in self.peers:
            if recipient != self:
                recipient.write_message({
                    'kind': 'message',
                    'value': message})

    def on_close(self):
        if not hasattr(self, 'peers'):
            return
        self.peers.remove(self)
        if not self.peers:
            del documents[self.document]

app = web.Application([
    ('/doc/(.*)', ParrotHandler),
    ('/doc_state/(.*)', DocumentStateHandler),
    ('/(.*)', web.StaticFileHandler, {'path':relpath('..')})
], debug=True)

if __name__ == '__main__':
    import os
    from tornado.ioloop import IOLoop
    port = int(os.environ.get('PORT', 5000))
    app.listen(port)
    print port
    IOLoop.instance().start()
