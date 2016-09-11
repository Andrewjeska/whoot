var socket = io();

var context = document.getElementById('canvas').getContext("2d");

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();

var drawData = new Array();
var paint;


function socketDraw(data){
    //receive data from socket io
    addExtClick(data);
    redraw();
}

//receving stuff from socket.io
socket.on('connection', function (socket) {

    var id;
    var username;
    var addedUser = false;
    var room;


    // when the server emits 'draw', this listens and executes
    socket.on('draw', function (data) {
        socketDraw(data)

    });
});

//send to latest json to socket io
function socketSend(x, y, dragging){
    socket.emit('drawUpdate', drawData[drawData.length - 1]);

}

$('#canvas').mousedown(function(e){

    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;

    paint = true;
    addSelfClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
    redraw();
});



$('#canvas').mousemove(function(e){
    if(paint){
        addSelfClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
        redraw();
    }
});

$('#canvas').mouseup(function(e){
    paint = false;
});

$('#canvas').mouseleave(function(e){
    paint = false;
});


function addExtClick(data){
    //adds one JSON (one stroke) to user canvas
    for(var i=0; i < data.path.length; i++) {
        clickX.push(data.path[i].x);
        clickY.push(data.path[i].y);
        clickDrag.push(data.path[i].dragging);

    }

}


function addSelfClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);


        if(dragging){ //(lineTo)
            if(drawData.length && drawData[drawData.length - 1].drag){
                //if we were just dragging (lineTo)
                drawData[drawData.length - 1].path.push({

                    drag: dragging,
                    x: x,
                    y: y

                })
            } else {
                //starting to drag (last thing was moveTo)
                drawData.push({
                    command: {
                        drag: dragging,
                        x: x,
                        y: y
                    },

                    path:[
                        {
                            drag: dragging,
                            x: x,
                            y: y
                        }
                        ]
                })
            }

        } else {
            //not dragging (moveTo). We have stopped dragging so we can send after
            if(drawData.length && drawData[drawData.length - 1].drag){
                //if we were just dragging (lineTo)
                drawData[drawData.length - 1].path.push({

                    drag: dragging,
                    x: x,
                    y: y

                })
            } else {
                //a single dot, no dragging (moveTo)
                drawData.push({
                    command: {
                        drag: dragging,
                        x: x,
                        y: y
                    },

                    path:[
                        {drag: dragging,
                            x: x,
                            y: y
                        }
                    ]
                })


            }
            socketSend(); //We send drawings that we have done, not the other guy
        }

    //}
}

function redraw(){
  var colors = ["#df4b26","184fe3", "1ee318" ]

  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

  context.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
  context.lineJoin = "round";
  context.lineWidth = 5;

  for(var i=0; i < clickX.length; i++) {
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
     }else{
       context.moveTo(clickX[i]-1, clickY[i]);
     }
     context.lineTo(clickX[i], clickY[i]);
     context.closePath();
     context.stroke();
  }
}
