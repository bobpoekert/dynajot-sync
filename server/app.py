import os, sys
import tornado.web as web
import transport

def drop_privs():
    try:
        os.setuid(os.environ['SUDO_UID'])
    except KeyError:
        sys.stderr.write('Must be run from sudo.\n')
        sys.exit(1)

