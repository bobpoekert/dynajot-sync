Dynajot
======

__NOTE: This is pre-release software. There are bugs (run js/tests/run_tests.sh to see the ones we have tests for). There are features that aren't built yet. You were warned.__


Dynajot is a javascript library and server that syncs changes to the DOM. 

*Usage:*

* Run `python sever/parrot.py`, which should bind to port `5000`
* Add `<script src="http://localhost:5000/js/build/build.js"></script>` to the page you want to sync
* Call `dynajot.sync(my_dom_node)`
	* `dynajot.sync` takes an optional second _options_ argument, which is a onbject containing any of the following keys:
		* __document_id__: The token identifying an existing document you want to connect to
		* __onDocumentId__: A function that gets called with the new document id when creating a new document
		* __onDelta__: Gets called with deltas as they come in over the wire (for testing)
		* __onChage__: Gets called with deltas as they're generated by the current page (also for testing)

There are usage examples in [examples/](examples/)

There's an architecture overview at [doc/arch.md](doc/arch.md)

An overview of all the modules is at [doc/notes.md](doc/notes.md)
