var compression = require('compression')
var express = require('express')

var app = express()


app.use(express.static(__dirname));

app.use(compression({ threshold: 0 }));

// add all routes
app.get('/json', function(req, res) {
  res.json('hello world');
});

app.get('/send', function(req, res) {
  res.send('hello world');
});

app.listen(6969, function () {
  console.log('Example app listening on port 3000!');
});

