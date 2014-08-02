var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

//Inits
var port = process.argv[2] || 10631;

////////////////////////////////////////////////////////////////////////
//Utils
////////////////////////////////////////////////////////////////////////
function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });

    return list;
}

////////////////////////////////////////////////////////////////////////
// Server
//////////////////////////////////////////////////////////////////////// 
http.createServer(function(request, response) {
 
   var url_parts = url.parse(request.url, true)
    , query = url_parts.query
    , uri = url.parse(request.url).pathname
    , filename = path.join(__dirname, '../www/', uri)
    , from = request.headers['x-forwarded-for'] || request.connection.remoteAddress;//TODO h ip h to onoma gia na kano login limit

//console.log(from);
//console.log(filename);

{
 //Serve static files 
 /*
  * Den yparxei logos na dino to mime type
  * gia kathe typo arxeiou (html,jpg,js,json klp)  
  * mias kai o apache proxy to diorthonei....
  * opote stelno ola xoris mime san binary...
  * 
  */
   
   //Just for fun :) 
   if ((filename.indexOf("serve")>-1)||(filename.indexOf("..")>-1)) {
      response.writeHead(418, {"Content-Type": "text/html"});
      response.write(" 418  I'm a teapot <br />\n Sorry, we don't serve coffee on teapot! <br />\n please see <a href='http://tools.ietf.org/html/rfc2324'>rfc2324</a> and <a href='http://tools.ietf.org/html/rfc7168'>rfc7168</a> <br />\n");
      response.end();
      return;
    }
    
   if ((filename.indexOf("pass")>-1)) {
      response.writeHead(402, {"Content-Type": "text/plain"});
      response.write("402 Pay me to give you access ;) ...\n");
      response.end();
      return;
    }

  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
 
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write("Some error on file reading\n");
        console.log(err);
        response.end();
        return;
      }
      
      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });

}

}).listen(parseInt(port, 10));
 
console.log("TinyStaticServer running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
