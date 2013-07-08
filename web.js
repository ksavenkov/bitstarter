var express = require('express');

var fs = require('fs')

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  var buffer = new Buffer(100);
  var fd = fs.openSync('index.html', 'r');
  fs.readSync(fd, buffer);
  response.send(buffer.toString());
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
