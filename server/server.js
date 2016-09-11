var url = require("url");
var express = require("express");
var bodyParser = require("body-parser");
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var roomStates = {};
var port = process.env.PORT || 3000;
var USERNAMES = ["( ͡° ͜ʖ ͡°)", "ಠ_ಠ", "Harambe", "Hugh Mungus", "Tuck Frump", "Kappa", "Pat", "Terry", "Frankie", "Tyler", "Dakota", "Sam", "Peyton", "Logan", "Jordan", "Hayden", "Stevie", "Jesse", "Devon", "Jamie", "Jaden"]

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
            roomStates[room] = {'numUsers':0, 'currentIds':{}};
        }
        socket.join(room);
        if(roomStates[room].numUsers >= USERNAMES.length) {
            socket.emit('denied', 'Room is full.');
            return;
        }

        id = nextId(room);
        roomStates[room].currentIds[id] = {'socket-id' : socket.id};
        username = USERNAMES[id];
        if (addedUser) return;

        roomStates[room].numUsers++;
        addedUser = true;
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
            roomStates[room].numUsers--;
            //remove id from room state

            //roomStates[room].currentIds.splice(roomStates[room].currentIds.indexOf(id), 1);
            delete roomStates[room].currentIds[id];
            // echo globally that this client has left
            socket.to(room).broadcast.emit('user left', {
                username: username,
                numUsers: roomStates[room].numUsers
            });
            if(roomStates[room].numUsers <= 0) {
                delete roomStates[room];
            }
        }
    });

    // a user starts a game and transitions into game mode
    socket.on('requestGameVote', function(){

        io.to(room).emit('transitionToGame');

        myRoom = roomStates[room];

        users = [];

        for(var ids in myRoom.currentIds){
            users.push(ids);
        }

        var hostId = users[Math.floor(Math.random() * users.length)];

        io.sockets.connected[myRoom.currentIds[hostId]['socket-id']].emit('pickTopic');
    });

    socket.on('topicPicked', function(topic){

        myRoom = roomStates[room];

        users = [];

        for(var ids in myRoom.currentIds){
            if(ids != id)
                users.push(ids);
        };


        var teamNum = 1;

        var teamMap = {};

        var room1 = room + ":1";
        var room2 = room + ":2";

        while(users.length > 0){

            i = Math.floor(Math.random() * users.length);
            var memberId = users[i];
            users.splice(i, 1);
            teamMap[memberId] = teamNum;

            if(teamNum == 1){
                io.sockets.connected[myRoom.currentIds[memberId]['socket-id']].join(room1);
                myRoom.currentIds[memberId]['team'] = 1
                teamNum = 2;
            }
            else{
                io.sockets.connected[myRoom.currentIds[memberId]['socket-id']].join(room2);
                myRoom.currentIds[memberId]['team'] = 2
                teamNum = 1;
            }
        }

        socket.broadcast.to(room1).emit('beginDrawing', {'topic' :topic, 'team' : '1'});
        socket.broadcast.to(room2).emit('beginDrawing', {'topic' :topic, 'team' : '2'});


        socket.join(room1);
        socket.join(room2);
    });

    socket.on('drawUpdate', function (drawData) {

        //get my team number
        var myRoom = roomStates[room];
        var teamNum = myRoom.currentIds[id]['team'];

        myRoom+= ':' + teamNum;

        socket.to(myRoom).broadcast.emit('drawUpdate', drawData)
    });
});

var nextId = function(room) {
    var r;

    while (true) {
        r = Math.trunc(Math.random() * USERNAMES.length);
        if(roomStates[room].currentIds[r] == null) {
            return r;
        }S
    }
}

var get_url = function(x) {
    var path = url.parse(x).pathname;
    return path.split("/")[1];
};
