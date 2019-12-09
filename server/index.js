
// let app = require('express')();
// let http = require('http').Server(app);
// let io = require('socket.io')(http);
// let port = process.env.PORT || 3000;

// app.use(express.static(path.join(__dirname, '/../dist')));

// io.on('connection', function(socket){
//   socket.on('chat message', function(msg){
//     io.emit('chat message', msg);
//   });
// });

// http.listen(port, function(){
//   console.log('listening on *:' + port);
// });

let express = require('express');
let app = express();
let path = require('path');

app.use(express.static(path.join(__dirname, '../whoisit/dist'))); //  "public" off of current is root
app.listen(2345);
console.log('Listening on port 2345');