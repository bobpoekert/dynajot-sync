Architecture Overview
=====

Dynajot works by tracking changes in the dom (from [js/change.js](js.change.js)), sending those changes to other browsers, maintaining a copy of the state on the server, and maintaining a total ordering of all the changes that occurred (so different clients always converge on the same state, even if they got changes in the "wrong" order).

The path that a change takes from being created in one browser to being applied in another is:

1. `change.changes` detects a change (via `mutation.onChange`), and produces a delta
2. That delta gets passed to a callback in `sync.sync` (`sync` is our only export, it's `dynajot` in the build)
3. `sync.sync` assigns it a message id with `ids.message_id` (this is globally unique, and used for ordering)
4. `timeline.addDelta` gets passed the delta, and adds it to the timeline so we can re-apply it if something comes in before it (in logical time) lataer (in wall time)
5. `conn.send` sends it over the websocket to the server
6. `parrot.ParrotHandler.on_message` receives the message off the websocket
7. `ParrotHandler` adds the delta to its `patch.Document` (which changes the initial state that new connections get sent)
8. `ParrotHandler` broadcasts the delta out to all of the other websocket connections for that document
9. The delta appears in a callback in `sync.sync` (line 178 at the time of this writing)
10. The delta gets passed to `timeline.changeset`, which looks for any deltas that occur after it in logical time and merges them together (in order) to produce one delta per dom node
11. Those deltas are passed to `enact.appliesDeltas`, which performs the dom changes needed to reflect the delta in the dom
