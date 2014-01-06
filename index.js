// Import all modules
var express = require('express'),
	path = require('path'),
    logfmt = require("logfmt");
	app = express(),
	battle = require('./battlegame');

app.use(logfmt.requestLogger());

// Create a simple Express application
app.configure(function() {
    // Turn down the logging activity
    app.use(express.logger('dev'));

    // Serve static html, js, css, and image files from the 'public' directory
    app.use(express.static(path.join(__dirname,'public')));
});

var port = process.env.PORT || 8080;

// Create a Node.js based http server on port 8080
var server = require('http').createServer(app).listen(port);

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);

// Reduce the logging output of Socket.IO
io.set('log level', 1);

// Listen for Socket.IO Connections. Once connected, start the game logic.
io.sockets.on('connection', function (socket) {
	// Let server know when the client disconnects
    socket.on('disconnect', function () {
        console.log('Client disconnected');
    });

	// Let server know a client connected
    console.log('Client connected');
    battle.initGame(io, socket);
});


