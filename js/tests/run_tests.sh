#!/bin/sh
cd ..
python -c 'import time, webbrowser; time.sleep(1); webbrowser.open("http://localhost:8888/tests/unittests.html")' &
python -m SimpleHTTPServer 8888
