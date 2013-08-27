import tornado.web as web
from tornado.ioloop import IOLoop
import os

base_path = os.path.dirname(os.path.abspath(__file__))
def relpath(p):
    return os.path.join(base_path, p)
app = web.Application([
    ('/(.*)', web.StaticFileHandler, {"path":relpath('..')})
], debug=True)

app.listen(8000)
IOLoop.instance().start()
