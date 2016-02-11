TinyStaticServer
================

Just a node static server

Put your files at www folder or at optional [path]
if you want https set [protocol] to https.

Use start.sh [path] [protocol] or node ./server/tiny.js [port] [path] [protocol] 

You can generate your own certificates with
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 10000

W A R N I N G 
this simple server is just a tool for developent of html pages, 
do not use it live!
  
