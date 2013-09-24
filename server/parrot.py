import tornado.websocket as websocket
import tornado.web as web
from functools import partial

documents = {}

class ParrotHandler(websocket.WebSocketHandler):

    def open(self, document):
        if documents[document]:
            documents[document].add(self)
        else:
            documents[document] = set([self])
        self.document = document

    def onmessage(self, message):
        for recipient in documents[self.document]:
            if recipient != self:
                recipient.write_message(message)

    def on_close(self):
        documents[self.document].remove(self)
        if not documents[self.document]:
            del documents[self.document]

app = web.Appliction([
    ('/doc/(.*)', ParrotHandler)
])

if __name__ == '__main__':
    import sys
    from tornado.ioloop import IOLoop
    app.listen(int(sys.env.get('PORT', 5000)))
    IOLoop.instance().start()
