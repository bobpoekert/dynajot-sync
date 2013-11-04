# Dynajot API Front-end Notes

## Overview

Use MutationObserver to get notified of change events from the browser (Chrome, Firefox)

Mutation Observer is deprecated, but that's okay because we're not using it for actual content of changes, just notifications of change events.

Dependencies / Browser Version Quirks:

- Changes: Use polling in browsers that don't support MutationObserver (IE<9)
- Sockets: Flash instead of sockets for IE

---

## File by File
Overview of each file in alphabetical order

### change.js
Detect, serialize, and send changes

### core.js
Extend Underscore.js with modified and added functionality

### crc.js
A cyclic redundancy check (CRC) is a non-secure hash function designed to detect accidental changes to raw computer data. Not used anywhere yet.

### Data.js

    loads existing stored dom data

### difflib.js
jsdifflib v1.0. <http://snowtide.com/jsdifflib>

### dom.js

    not sure what this is, interface to id from the dom and helper functions for common dom operations?

### enact.js
Apply changes received to the user's dom nodes

- [fillmeout]

### ids.js
Utility functions for ids:

- retrieve or generate document hash ids 
- retrieve global timestamp
- assemble message_id's

### indexdb_storage.js
initialize indexdb localstorage db & schema

### json.js
<http://www.JSON.org/js.html> JSON functions for non-modern browsers

### load_swf.js
IE shenanigans for sockets through swf, used by socket.js

### localstorage_storage.js
store, pack, get, etc. functions for local storage

### msgpack.js
(<http://msgpack.sourceforge.net/>) would be used to serialize/deserialize change data for localStorage

### mutation.js
Uses MutationObserver to check if the nodes have been modified and triggering callback.  It's the caller's responsibility to check before doing anything, to avoid infinite recursion. The call back we have prevents infinite recursion by storing the serialized dom node in jQuery data & diffing in the callback to ensure the incoming change is a new one.

If IE <9, fallback to polling with dom.traverse

### sequence_store.js
conditional code for index db vs local storage

### socket.js
Cross browser socketing

### storage.js
Currently short-circuited to use localStorage, but we'll need to use indexDB and serialize more complex objects (the deltas that transferred over the wire) when using localStorage, most likely using lz77 compressed json or msgpack

### swfobject.js
N/A, not used anywhere but would let you inject swf's.

### sync.js
The main API js file. Check or create the URL hash of a page, and use that to connect to a particular document socket
    
We should offer sample pasteable code for when the developer is already using the hash that reads/assembles a query string in the hash

    
