from xml.sax.saxutils import escape, quoteattr
import traceback
from functools import wraps

unclosed_tags = frozenset([
    'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen',
    'link', 'meta', 'param', 'source', 'trace', 'wbr'])

def recursive(fn):

    @wraps(fn)
    def res(*args):
        stack = [args]
        def recur(*args):
            stack.append(args)
        retval = None
        while stack:
            retval = fn(recur, *stack.pop())
        return retval

    return res

@recursive
def token_list(token_list, nodes, node, res=[]):
    if type(node) != Node:
        res.append(escape(node))
    elif node.name:
        res.append('<')
        res.append(node.name)
        for k, v in node.attrs.iteritems():
            res.append(' ')
            res.append(k.replace('=', ''))
            res.append('=')
            res.append(quoteattr(v))
        res.append(' data-id="')
        res.append(node.id)
        res.append('">')
        if node.name not in unclosed_tags:
            for child in node.children:
                if child['kind'] == 'id':
                    token_list(nodes, nodes[child['value']], res)
                else:
                    res.append(child['value'])
            res.append('</')
            res.append(node.name)
            res.append('>')
    else:
        for child in node.children:
            if child['kind'] == 'id':
                token_list(nodes, nodes[child['value']], res)
            else:
                res.append(child['value'])

    return res

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
            node.children = node.children[:slc['start']] +\
                    slc['value'] + node.children[slc['end']:]

        if delta.get('position'):
            node.position = delta['position']


    def to_html(self):
        try:
            root = self.nodes['_root']
        except KeyError:
            return ''
        return ''.join(token_list(self.nodes, root,))

    def __iter__(self):
        try:
            stack = [self.nodes['_root']]
        except KeyError:
            return
        while stack:
            node = stack.pop()
            yield node
            for i, child in enumerate(node.children):
                if child['kind'] == 'id':
                    try:
                        child_node = self.nodes[child['value']]
                        if not child_node.position:
                            child_node.position = {
                                'parent': node.id,
                                'index':i
                            }
                        stack.append(child_node)
                    except KeyError:
                        pass
