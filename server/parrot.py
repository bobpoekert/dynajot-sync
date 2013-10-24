import tornado.websocket as websocket
import tornado.web as web
from functools import partial

import os, hashlib
import json
import time

import patch

base_path = os.path.dirname(os.path.abspath(__file__))
def relpath(p):
    return os.path.join(base_path, p)

def random_id():
    return hashlib.sha1(os.urandom(20)).hexdigest()

document_connections = {}
document_trees = {}
document_counters = {}
document_playback = {}

class DocumentStateHandler(web.RequestHandler):

    def get(self, document_id):
        if document_id.endswith('.json'):
            doc = document_id.split('.')[0]
            self.write(dict((k, v.to_dict()) for k, v in document_trees[doc].nodes.iteritems()))
        else:
            #try:
            self.write(document_trees[document_id].to_html())
            #except KeyError:
            #    self.send_error(404)


class GetDeltasHandler(web.RequestHandler):

    def get(self, document_id):
        if document_id:
            self.write(document_playback)
        else:
            self.send_error(404)


class TestDeltasHandler(websocket.WebSocketHandler):

    def open(self, document):
        try:
            with open(relpath('../static/todo_test_deltas.json')) as f:
                messages = json.load(f)
                time.sleep(1)
                count = 0
                max_deltas = 999
                for message in messages:
                    if message["kind"] == "document_state":
                        self.write_message(message)
                    else:
                        self.write_message({'kind':'message', 'value':message})
                    count += 1
                    if count > max_deltas:
                        print message
                        break
                print "sent deltas"
        except:
            print "failed"
            self.close()



class ParrotHandler(websocket.WebSocketHandler):

    def open(self, document):
        if not document:
            new_id = None
            while (not new_id) or (new_id in document_connections):
                new_id = random_id()
            document = new_id
            document_playback[document] = []
            self.write_message({'kind': 'document_id', 'value':document})

        if document in document_trees:
            print {
                'kind':'document_state',
                'value': document_trees[document].to_html()}
            self.write_message({
                'kind':'document_state',
                'value': document_trees[document].to_html()})
        else:
            document_trees[document] = patch.Document()
            self.write_message({
                'kind':'document_state',
                'value': False})

        if document in document_connections:
            document_connections[document].add(self)
        else:
            document_connections[document] = set([self])

        self.document = document

    def process_request(self, request):
        resource = request['resource']
        value = None
        if resource.startswith('/nodes/'):
            try:
                value = document_trees[self.document].nodes[resource.split('/')[-1]]
            except KeyError:
                value = {'kind':'error', 'value':404}
        else:
            value = {'kind': 'error', 'value': 404}

        self.write_message({
            'kind': 'response',
            'value': {
                'id': request['id'],
                'value': value
            }
        })

    def on_message(self, blob):
        message = json.loads(blob)
        print message
        counter = document_counters.get(self.document, 0)
        document_counters[self.document] = counter + 1

        if message["kind"] == "delta":
            document_trees[self.document].apply_delta(message["value"])

        if message['kind'] == 'request':
            self.process_request(message['value'])
            return

        message['global_timestamp'] = counter

        document_playback[self.document].append({'kind':'message', 'value':message})
        for recipient in document_connections[self.document]:
            if recipient != self:
                recipient.write_message({
                    'kind': 'message',
                    'value': message})

    def on_close(self):
        if not hasattr(self, 'document'):
            return
        peers = document_connections[self.document]
        peers.remove(self)
        if not peers:
            del document_connections[self.document]

app = web.Application([
    ('/doc/(.*)', ParrotHandler),
    ('/doc_state/(.*)', DocumentStateHandler),
    ('/deltas/(.*)', GetDeltasHandler),
    ('/deltatest/(.*)', TestDeltasHandler),
    ('/(.*)', web.StaticFileHandler, {'path':relpath('..')})
], debug=True)

if __name__ == '__main__':
    import os
    from tornado.ioloop import IOLoop
    port = int(os.environ.get('PORT', 5000))
    app.listen(port)
    print port
    IOLoop.instance().start()
