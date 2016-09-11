$(document).ready(function() {

  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [ '#e21400', '#91580f', '#f8a700', '#f78b00', '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7' ];
  // Initialize variables
  var $window = $(window);
  //var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $drawingPill = $('.drawing-pill');
  var $paint = $('.paint');
  var $paint2 = $('.paint2');
  $paint.hide();
  $paint2.hide();

  //var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $inputMessage.focus();

  var socket = io();

  /*
  export function getSocket(){
      return socket;
  }
  */

  var room_id = $(location).attr('pathname').split("/")[1];
  socket.emit('add user', room_id);
  $chatPage.show();

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  /*
  $loginPage.fadeOut();
  $chatPage.show();
  $loginPage.off('click');
  $currentInput = $inputMessage.focus();
  */
  // Sets the client's username

  function setUsername () {
    //username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    //if (username) {
      //$loginPage.fadeOut();
      $chatPage.show();
      //$loginPage.off();
      $currentInput = $inputMessage.focus();

      // Tell the server your username
    //}
  }



  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message)
      .css('color', getUsernameColor(data.username));

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  $drawingPill.click(function() {
    if($drawingPill.hasClass('disabled')) return;
    socket.emit('requestGameVote');
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    username = data.username;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – " + data.username;
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  socket.on('denied', function(reason) {
    log('Could not join. ' + reason);
    socket.disconnect();
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('requestGameVote', function(data) {
  });

  socket.on('transitionToGame', function(data) {
    $('.chat').hide();
    $('.chat-pill').removeClass('active');
    $drawingPill.addClass('disabled').addClass('active');
  });

  socket.on('beginDrawing', function(data) {
    var topic = data.topic;
    var team = data.team;
    $('.theme').text("Theme: " + topic);
    $paint.show();
    $('button').remove();
  });

  socket.on('pickTopic', function() {
    var topic = prompt('Pick a topic to be drawn');
    socket.emit('topicPicked', topic);
    $paint.show();
    $paint2.show();
    //other things for this guy
    //$(".theme").remove();
    //$('.theme').text("Theme: " + topic);
    $( "h3" ).remove();
  });




//paint-game


var context = document.getElementById("canvas").getContext("2d");


var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();

var drawData = new Array(); //our strokes to send to other team
var paint;


//import socket from 'chat-room';
//console.log(socket);

function socketDraw(data){
    //receive data from socket io
    addExtClick(data);
    redraw();
}

//receving stuff from socket.io
//socket.on('connection', function (socket) {

    // when the server emits 'draw', this listens and executes
    socket.on('sendDrawing', function (data) {
        console.log("updating from other user")
        socketDraw(data)

    });
//});

//send to latest json to socket io
function socketSend(x, y, dragging){
    console.log("sending data");
    socket.emit('drawUpdate', drawData);

}



$('#canvas').mousedown(function(e){

    //var mouseX = e.pageX - this.offsetLeft;
    //var mouseY = e.pageY - this.offsetTop;

    paint = true;
    addSelfClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
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

 for(var i = 0; i < data.length; i++){
    for(var j = 0; j < data[i].path.length; j++) {
        clickX.push(data[i].path[j].x);
        clickY.push(data[i].path[j].y);
        clickDrag.push(data[i].path[j].dragging);

    }
}
}


function addSelfClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);

        if(dragging){ //(lineTo)
            if(drawData.length && drawData[drawData.length - 1].drag){
                //if we were just dragging (lineTo)
                //if our command was lineTo
                drawData[drawData.length - 1].path.push({

                    drag: dragging,
                    x: x,
                    y: y

                })
            } else if (drawData[drawData.length - 1].path[drawData[drawData.length - 1].path.length - 1].drag ){

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

        }

    //}
    console.log(drawData);
}


setInterval(function(){socketSend();}, 3000);

function redraw(){


  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

  context.strokeStyle = "#1ee318";
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



});
