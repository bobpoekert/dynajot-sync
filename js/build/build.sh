#!/bin/sh
echo '(function() {' > /tmp/build.js
ls ../*.js | xargs java -jar compiler.jar --process_common_js_modules --transform_amd_modules --common_js_entry_module=sync.js --common_js_module_path_prefix=.. >> /tmp/build.js
echo ' window["dynajot"] = module$sync; }());' >> /tmp/build.js
java -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js /tmp/build.js > build.js
rm /tmp/build.js
