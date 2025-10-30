#!/usr/bin/env python3
"""
Passenger WSGI file for cPanel Node.js deployment
This tells Passenger how to start the Node.js application
"""

import sys
import os

# Not needed for Node.js apps, but required by Passenger
def application(environ, start_response):
    start_response('200 OK', [('Content-Type', 'text/plain')])
    return [b'Node.js app is running via Passenger']
