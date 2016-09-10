var url = require("url");
var express = require("express");
var bodyParser = require("body-parser");
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var roomStates = {};
var port = process.env.PORT || 3000;
var USERNAMES = ["Joe", "Nick", "Steve", "Bill", "Mary", "Greg", "Harambe"]

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});


app.use(bodyParser.json());
app.use(express.static(path.resolve("app")));


app.get("/", function (req,res){
    res.sendFile("index.html",{ root: __dirname + "/../app" });
});

app.get("/[a-z]{4}/", function(req,res,next){
    var room = get_url(req.url);
    res.sendFile("index.html",{ root: __dirname + "/../app" });
});

var numUsers=0;
var currentIds=[]

io.on('connection', function (socket) {

    var id;
    var username;
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {

        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (room) {
        if(numUsers >= USERNAMES.length) {
            socket.emit('denied', 'Room is full.');
            return;
        }
        socket.join(room);
        id = nextId();
        currentIds.push(id);
        username = USERNAMES[id];
        if (addedUser) return;

        // we store the username in the socket session for this client
        ++numUsers;
        addedUser = true;
        console.log("login for " + username);
        socket.emit('login', {
            username: username,
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.emit('typing', {
            username: username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing', {
            username: username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --numUsers;
            currentIds.splice(currentIds.indexOf(id), 1);
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: username,
                numUsers: numUsers
            });
        }
    });
});

var nextId = function() {
    var r;
    while (true) {
        r = Math.trunc(Math.random() * USERNAMES.length);
        if(currentIds.indexOf(r) == -1) {
            return r;
        }
    }
}

var get_url = function(x) {
    var path = url.parse(x).pathname;
    return path.split("/")[1];
};
