from functools import partial

class Multi(object):

    def __init__(self, callback):
        self.callback = callback
        self.results = []
        self.n_expected = 0
        self.n_delivered = 0
        self.started = False
        self.fired = False

    def get_callback(self):
        n = self.n_expected
        self.n_expected += 1
        self.results.append(None)
        return partial(self._deliver, n)

    def _deliver(self, n, result):
        self.results[n] = result
        self.n_delivered += 1
        self.maybe_fire()

    def maybe_fire(self):
        if self.started and not self.fired and self.n_expected <= self.n_delivered:
            self.callback(*self.results)
            self.fired = True

    def start(self):
        self.started = True
        self.maybe_fire()


