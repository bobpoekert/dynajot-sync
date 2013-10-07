
class Node(object):

    def __init__(self,
        id,
        name,
        attrs={},
        children=[],
        position=None):
        self.id = id
        self.name = name
        self.attrs = attrs
        self.children = children
        self.position = position

    def to_dict(self):
        return dict(
            name=self.name,
            attrs=self.attrs,
            children=self.children,
            position=self.position,
            id=self.id)

class Document(object):

    def __init__(self):
        self.nodes = {}

    def apply_delta(self, delta):
        node = self.nodes.get(delta['id'])
        if not node:
            node = Node(
                delta['id'],
                delta['name'])
            self.nodes[delta['id']] = node

        attrs = delta.get('attrs')
        if attrs:
            for k, v in attrs.get('+', {}).iteritems():
                node.attrs[k] = v
            for k in attrs.get('-', {}).iterkeys():
                del node.attrs[k]

        for slc in delta.get('children', []):
            print '****', delta, slc
            node.children = node.children[:slc['start']] +\
                    slc['value'] + node.children[slc['end']:]

        if delta.get('position'):
            node.position = delta['position']


    def __iter__(self):
        return self.nodes.itervalues()
