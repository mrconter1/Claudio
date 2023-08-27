from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

def run(server_class=HTTPServer, handler_class=CustomHandler):
    os.chdir("./")  # the directory where your index.html and .wav file is present
    server_address = ('', 8000)  # specify the port number
    httpd = server_class(server_address, handler_class)
    httpd.serve_forever()

run()

