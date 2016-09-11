var socket = io();

var context = document.getElementById('canvas').getContext("2d");

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();

var drawData = new Array();
var paint;

$('#canvas').mousedown(function(e){

    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;

    paint = true;
    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
    redraw();
});

function socketSend(x, y, dragging){
    //send to socket io

    socket.emit('drawUpdate', drawData[drawData.length - 1]);

}

function socketDraw(x, y, dragging){
    //receive data from socket io
    //
    socket.on(//something)
    addClick(x, y, dragging);
    redraw();


}

$('#canvas').mousemove(function(e){
    if(paint){
        addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
        redraw();
    }
});

$('#canvas').mouseup(function(e){
    paint = false;
});

$('#canvas').mouseleave(function(e){
    paint = false;
});



function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);

    //TODO: if(this click came from THIS user)
    if(dragging){
        if(drawData[drawData.length - 1].drag){
            //if we were just dragging (lineTo)
            drawData[drawData.length - 1].path.push({

                drag: dragging,
                x: x,
                y: y

            })
        } else {
            //starting to drag (last thing was moveTo)
            drawData.push({
                command {
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


    } else {
        //not dragging (moveTo). We have stopped dragging so we can send
        if(drawData[drawData.length - 1].drag){
            //if we were just dragging (lineTo)
            drawData[drawData.length - 1].path.push({

                drag: dragging,
                x: x,
                y: y

            })
        } else {
            //a single dot, no dragging (moveTo)
            drawData.push({
                command {
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

            socketSend(); //We send drawings that we have done, not the other guy
        }
}

function redraw(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

  context.strokeStyle = "#df4b26";
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
