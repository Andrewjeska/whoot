var url = require("url");
var express = require("express");
var bodyParser = require("body-parser");
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var roomStates = {};
var port = process.env.PORT || 3000;
var USERNAMES = ["( ͡° ͜ʖ ͡°)", "ಠ_ಠ", "Pat", "Terry", "Frankie", "Tyler", "Dakota", "Sam", "Peyton", "Logan", "Jordan", "Hayden", "Stevie", "Jesse", "Devon", 'Jamie", "Jaden"]

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

io.on('connection', function (socket) {

    var id;
    var username;
    var addedUser = false;
    var room;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        socket.to(room).broadcast.emit('new message', {
            username: username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (path) {
        room = path;
        if(roomStates[room] == null) {
            roomStates[room] = {'numUsers':0, 'currentIds':[]};
        }
        socket.join(room);
        if(roomStates[room].numUsers >= USERNAMES.length) {
            socket.emit('denied', 'Room is full.');
            return;
        }
        id = nextId(room);
        roomStates[room].currentIds.push(id);
        username = USERNAMES[id];
        if (addedUser) return;

        // we store the username in the socket session for this client
        (roomStates[room].numUsers)++;
        addedUser = true;
        console.log("login for " + username);
        socket.emit('login', {
            username: username,
            numUsers: roomStates[room].numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.to(room).broadcast.emit('user joined', {
            username: username,
            numUsers: roomStates[room].numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.to(room).broadcast.emit('typing', {
            username: username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.to(room).broadcast.emit('stop typing', {
            username: username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --(roomStates[room].numUsers);
            currentIds.splice(currentIds.indexOf(id), 1);
            // echo globally that this client has left
            socket.to(room).broadcast.emit('user left', {
                username: username,
                numUsers: roomStates[room].numUsers
            });
            if(roomStates[room].numUsers <= 0) {
                roomStates[room] = null;
            }
        }
    });
});

var nextId = function(room) {
    var r;
    while (true) {
        r = Math.trunc(Math.random() * USERNAMES.length);
        if(roomStates[room].currentIds.indexOf(r) == -1) {
            return r;
        }
    }
}

var get_url = function(x) {
    var path = url.parse(x).pathname;
    return path.split("/")[1];
};
