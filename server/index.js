// Require dependencies
let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let path = require('path');

// Set up port
let port = process.env.PORT || 8080;
server.listen(port);
console.log('Listening on port' + port);

// Set up static file server (front-end dist folder)
app.use(express.static(path.join(__dirname, '../whoisit/dist')));

let openRooms = [] // Open room is a room with only 1 player :(
const godview = io.of('/godview'); // Namespace for all access view

io.on('connection', (socket) => {

    let matchRoom = ''; // the room this socket is connected to

    socket.on('join-room', () => {

        // If someone is waiting for a match, put our new connection in this room
        if(openRooms.length>0){
            
            let openRoom = openRooms.shift(); // Shift returns first item of array and removes it
            socket.join(openRoom);
            matchRoom = openRoom;

            socket.in(matchRoom).emit('match-made', matchRoom);
            socket.emit('match-made', matchRoom);

        }else{
            console.log('New connection. No players in queue, putting in queue:')
            
            // Generate random string for new room
            let newRoom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            openRooms.push(newRoom);

            socket.join(newRoom)
            matchRoom = newRoom;
        }

        godview.emit('joined-room',{
            id:socket.id,
            room:matchRoom
        })

    });

    socket.on('disconnect', () => {
     // If player has no matchroom, they did not even click the start button yet so nothing matters
      if(matchRoom!==''){
        let index = openRooms.indexOf(matchRoom);
        
        // If player was in open room (c.q. still alone), no worries
        // just remove it from open rooms list
        if(index>=0){
            openRooms.splice(index,1);
            godview.emit('log',{room:matchRoom, user: socket.id, msg:'disconnected from waiting room'}); 
        }else{

           // let other user know they are alone:((()
           socket.to(matchRoom).emit('match-terminated');
           godview.emit('log',{room:matchRoom, user: socket.id, msg:'disconnected from active room'}); 
        }
      }
    });

    // Relay chat and typing events to the other user
    socket.on('chat-message', (data) => {
        socket.to(matchRoom).emit('chat-message', (data));
        godview.emit('log',{room:matchRoom, user: socket.id, msg:data}); 
    });

    socket.on('typing', (data) => {
        socket.to(matchRoom).emit('typing', true);
    });

    socket.on('stopTyping', () => {
        socket.to(matchRoom).emit('stopTyping');
    });

});
