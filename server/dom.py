from weakref import WeakValueDictionary, ref
from xml.sax.saxutils import escape, quoteattr

unclosed_tags = frozenset([
    'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen',
    'link', 'meta', 'param', 'source', 'trace', 'wbr'])

def token_list(node, res=[]):
    if type(node) != Node:
        res.append(escape(node))
    elif node.tagname:
        res.append('<')
        res.append(node.tagname)
        for k, v in node.attrs.iteritems():
            res.append(' ')
            res.append(k.replace('=', ''))
            res.append('=')
            res.append(quoteattr(v))
        res.append('>')
        if node.tagname not in unclosed_tags:
            for child in node.children:
                token_list(child, res)
            res.append('</')
            res.append(node.tagname)
            res.append('>')
    else:
        for child in node.children:
            token_list(child, res)

    return res
class Node(object):

    def __init__(self, tagname=None, attrs={}, children=[], parent=None):
        self.tagname = tagname
        self.attrs = attrs
        self.children = children
        self.parent = parent

    def __str__(self):
        return ''.join(token_list(self))

    def __repr__(self):
        return 'Node: %s' % str(self)

    def set_parent(self, parent):
        if parent == None:
            self._parent = None
        else:
            self._parent = ref(parent)

    def get_parent(self):
        try:
            if self._parent == None:
                return None
            return self._parent()
        except AttributeError:
            return None

    parent = property(get_parent, set_parent)

    def yank(self):
        if self.parent:
            self.parent.children.remove(self)
            self.parent = None

    def insert_child(self, other, index=-1):
        if hasattr(other, 'yank'):
            other.yank()
        if index >= 0:
            print index
            self.children.insert(index, other)
        else:
            self.children.append(other)
        if hasattr(other, 'parent'):
            other.parent = self

    def splice(self, start, end, insertion):
        self.children = self.children[:start] + insertion + self.children[end:]

class DocumentTree(object):

    def __init__(self):
        self.tree = Node()
        self.node_ids = WeakValueDictionary()

    def re_hydrate_node(self, inp):
        if type(inp) == Node:
            return inp
        elif inp.get('kind') == 'id':
            return self.get_node(inp['value'])
        elif inp.get('kind') == 'text':
            return inp['value']
        else:
            res = Node(
                tagname=inp['name'],
                attrs=(inp.get('attrs') or {}),
                children=map(self.re_hydrate_node, inp.get('children', [])))
            self.set_node_id(res, inp['id'])
            return res

    def set_node_id(self, node, _id):
        node._id = _id
        self.node_ids[_id] = node
        print self.node_ids
        cls = node.attrs.get('class')
        if cls:
            parts = [e for e in cls.split() if not e.startswith('dynajot-')]
            parts.append('dynajot-%s' % _id)
            node.attrs['class'] = ' '.join(parts)
        else:
            node.attrs['class'] = 'dynajot-%s' % _id

    def get_node(self, _id):
        if _id == '_root':
            return self.tree
        else:
            return self.node_ids[_id]

    def apply_delta(self, delta):
        node = None
        if delta.get('create') and delta['id'] not in self.node_ids:
            delta['create']['id'] = delta['id']
            delta['position'] = delta['create']['position']
            node = self.re_hydrate_node(delta['create'])
            self.set_node_id(node, delta['id'])
        elif delta.get('create'):
            node = self.get_node(delta['id'])
            delta['create']['id'] = delta['id']
            delta = delta['create']
        else:
            node = self.get_node(delta['id'])

        parent_id = delta.get('position', {}).get('parent')

        if parent_id:
            parent = self.get_node(parent_id)
        else:
            parent = None

        if parent:
            parent.insert_child(node, delta['position']['index'])

        if delta.get('attrs'):
            for k, v in delta['attrs'].get('+', {}).iteritems():
                node.attrs[k] = v
            for k in delta['attrs'].get('-', {}).iterkeys():
                del node.attrs[k]

        if delta.get('children'):
            for _slice in delta['children']:
                new_nodes = []
                for new_node in _slice['value']:
                    new_nodes.append(self.re_hydrate_node(new_node))
                node.splice(_slice['start'], _slice['end'], new_nodes)

    def __str__(self):
        return str(self.tree)
