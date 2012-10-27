var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8000);

// app.use(express.logger());

app.use(express.static(__dirname + '/public'));

// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/public/index.html');
// });

var clientSockets = [];
var controlSocket = null;
var currentId = 0;
var notes = {}
console.log("WWWWWWWait");

io.of('/control').on('connection', function (socket) {

  socket.emit('news', {clientCount: clientSockets.length});

  controlSocket = socket;

  console.log("CONNECT control");
  socket.on('noteon', function (data) {
    console.log("noteon", data.note);
    if (notes[data.note]) return;
    if (clientSockets.length < 1) return;



    var sendToNext = function(data, count) {
      currentId = (currentId + 1) % clientSockets.length;
      var client = clientSockets[currentId];
      // console.log(clientSockets[currentId]);
      console.log("trying", client.id)
      client.emit("noteon", data, function(accepted) {
        if (accepted) {
          console.log("saving", client.id)
          notes[data.note] = {client: client};
        } else if (count < 10) {
          sendToNext(data, count + 1);
        }
      });
    };
    sendToNext(data, 0);
  });

  socket.on('noteoff', function(data) {
    if (!notes[data.note]) return;
    console.log("noteoff", data.note, notes[data.note].client.id);
    notes[data.note].client.emit("noteoff", {});
    delete notes[data.note];
  });

  socket.on('panic', function() {
    clientSockets.forEach(function(client){
      client.emit("panic", {});
    });
  })


});

io.of('/play').on('connection', function (socket) {
  clientSockets.push(socket);
  if (controlSocket) controlSocket.emit("news", {clientCount: clientSockets.length});
  socket.emit("news", {'name': 'test'});

  socket.on('my other event', function (data) {
    console.log(data);
  });
  socket.on('disconnect', function() {
    console.log("disconnect", socket);
    if (controlSocket) controlSocket.emit("news", {clientCount: clientSockets.length});
    clientSockets = clientSockets.filter(function(obj) {
      return (obj !== socket);
    });
  });
});