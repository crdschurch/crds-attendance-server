var express = require('express');
var cors = require('cors');
var compression = require('compression');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var path = require('path');
var root = path.resolve(__dirname, '../dev/');

if (process.env.NODE_ENV === 'prod') {
    root = path.resolve(__dirname, '../prod/');
}

var node_modules = path.resolve(__dirname, '../../node_modules');
var server = express();

// Set up CORS. Accept any origin
// To lock this down further or create a whitelist
// see examples here: https://github.com/expressjs/cors

// If we want to whitelist certain IPS here we can uncomment this section and the corsOptions callback for origin
// var whitelist = ['http://localhost:4200', 'https://*.crossroads.net']
var corsOptions = {
  origin: function (origin, callback) {
      callback(null, true);
    // if (whitelist.indexOf(origin) !== -1) {
    //   callback(null, true)
    // } else {
    //   callback(new Error('Not allowed by CORS'))
    // }
  },
  credentials: true
}

server.use(cors(corsOptions));

server.options('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin',      req.headers.origin);
    next();
});

server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin',      req.headers.origin);
    res.header('Access-Control-Allow-Methods',     'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers',     'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, set-cookie');
    next();
});

server.use(compression());
server.use(bodyParser.json());

require('./api')(server);
server.use('/', serveStatic(root));
server.use('/images/', serveStatic(root + '/assets/images/'));
server.use('/fonts/', serveStatic(root + '/assets/font-awesome/fonts/'));
server.use('/fonts/', serveStatic(node_modules + '/bootstrap/fonts/'));

if (process.env.NODE_ENV !== 'prod') {
    var dist = path.resolve(__dirname, '../');
    server.use('/node_modules/', serveStatic(node_modules));
    server.use('/dist/', serveStatic(dist));
}

server.use(function(req, res) {
    res.sendFile(root + '/index.html');
});

server.listen(8000, function() {
   console.log('Listening on 8000');
});
