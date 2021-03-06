var http = require("http"),
    https = require('https'),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    runner = require("child_process");
    
var mime;
try {
  mime = require("mime").lookup;
} catch(e) {
  mime = get_mime;   
}

//Inits
var port = process.argv[2] || 10631;
var www  = process.argv[3] || path.join(__dirname,"../www/"); //Have to be fullpath
var protocol = process.argv[4]=="https"?"https":"http" || "http";

////////////////////////////////////////////////////////////////////////
//Utils
////////////////////////////////////////////////////////////////////////
function getExtension(filename) {
    return filename.split('.').pop();
}

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
//common mime types (for complete list use node-mime module)
////////////////////////////////////////////////////////////////////////
function get_mime(filename){
var type="";
switch(getExtension(filename)){
case "css":
     type="text/css";
break;
case "htm":
case "html":
   type="text/html";
break;
case "json":
   type="application/json";
break;
case "js":
   type="application/javascript";
break;
case "jpeg":
case "jpg":
   type="image/jpeg";
break;
case "png":
   type="image/png";
break;
case "gif":
   type="image/gif";
break;
};
return type;
}

////////////////////////////////////////////////////////////////////////
// PHP cli support 
////////////////////////////////////////////////////////////////////////
function sendPHPError(errCode, errString, response)
{
  console.log(errCode,errString,response);
  response.writeHead(errCode, {"Content-Type": "text/plain;charset=utf-8"});
  response.write(errString + "\n");
  response.end();
  return false;
}

function sendPhpResponce(err, stdout, stderr, response)
{
  //console.log(err);
  if (err) return sendPHPError(500, stderr, response);
  response.writeHead(200,{"Content-Type": "text/plain;charset=utf-8"});
  response.write(stdout);
  response.end();
}

 function serialize(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

////////////////////////////////////////////////////////////////////////
// Server
////////////////////////////////////////////////////////////////////////

var Server = function(request, response) {
 
   var url_parts = url.parse(request.url, true)
    , query = url_parts.query
    , uri = url.parse(request.url).pathname
    , filename = path.join(www, uri)
    , from = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

if (getExtension(uri)=="php") {

var script = www+path.basename(uri);

var QUERY_STRING = serialize(query);
runner.exec("export QUERY_STRING='"+QUERY_STRING+
            "' ; php -e -r 'parse_str($_SERVER[\"QUERY_STRING\"], $_GET); include \"" + script +
            "\";'",{maxBuffer: 1024 * 20000},//20MB
             function(err, stdout, stderr) {
                    sendPhpResponce(err, stdout, stderr, response);
              });

//TODO do the same with $_POST and $_COOKIE

} else
{
 //Serve static files 
  
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
      
      response.writeHead(200,{"Content-Type":mime(filename)});
      response.write(file, "binary");
      response.end();
    });
  });

}

}

if(protocol=="https"){
var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
  https.createServer(options,Server).listen(parseInt(port, 10));
} else
  http.createServer(Server).listen(parseInt(port, 10));

console.log("TinyStaticServer running at\n  => "+protocol+"://localhost:" + port + "/\nCTRL + C to shutdown");
