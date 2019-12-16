// Require dependencies
let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let path = require('path');
let questions = require('./question-loader.js');

// Set up port
let port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

// Set up static file server (front-end dist folder)
app.use(express.static(path.join(__dirname, '../whoisit/dist')));

let activeRooms = [];
let openRooms = []; // Open room is a room with only 1 player :(

function activeRoomIndex(roomId) {
    for (let i = 0; i < activeRooms.length; i++) {
        if (activeRooms[i].room_id == roomId) {
            return i;
        }
    }

    return -1;
}

let godview = io.of('/godview'); // Namespace for all access view

// Watch godview connection and give ability to kill a room
godview.on('connection', (socket) => {
    socket.on('kill-room', (roomId) => {
        console.log(`Kill room ${roomId}`);

        io.in(roomId).clients((error, clients) => {
            if (error)
                console.log(error)

            for (let client of clients) {
                console.log('clients in room: ' + client)
                io.to(client).emit('room-killed');

                let clientSocket = io.sockets.connected[client];
                clientSocket.leave(roomId);
            }
        });
    });
});

io.on('connection', (socket) => {
    let matchRoom = ''; // the room this socket is connected to
    let positionInRoom = -1;

    let sendQuestions = (playerIndex) => {
        let room = activeRooms[activeRoomIndex(matchRoom)];
        let questions = room.pooler.getNewQuestions(playerIndex);
        socket.in(matchRoom).emit('question-prompt', questions);
    }

    socket.on('join-room', () => {
        // If someone is waiting for a match, put our new connection in this room
        if (openRooms.length > 0) {
            let openRoom = openRooms.shift(); // Shift returns first item of array and removes it
            socket.join(openRoom);
            matchRoom = openRoom;

            // Create a new active room
            activeRooms.push({
                room_id: matchRoom,
                currentRound: 0,
                pooler: new questions.Pooler(2)
            });

            // position in room is 0; they are the first person to join the room
            positionInRoom = 1;

            // Start the first question
            sendQuestions(positionInRoom === 1 ? 0 : 1);

            socket.in(matchRoom).emit('match-made', matchRoom);
            socket.emit('match-made', matchRoom);
        }
        else {
            console.log('New connection. No players in queue, putting in queue:')

            // Generate random string for new room
            let newRoom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            openRooms.push(newRoom);

            // position in room is 0; they are the first person to join the room
            positionInRoom = 0;

            socket.join(newRoom)
            matchRoom = newRoom;
        }

        godview.emit('joined-room', {
            id: socket.id,
            room: matchRoom
        })

    });

    socket.on('disconnect', () => {
        // If player has no matchroom, they did not even click the start button yet so nothing matters
        if (matchRoom !== '') {
            let index = openRooms.indexOf(matchRoom);

            // If player was in open room (c.q. still alone), no worries 
            // just remove it from open rooms list
            if (index >= 0) {
                openRooms.splice(index, 1);
                godview.emit('log', {
                    room: matchRoom,
                    user: socket.id,
                    message: 'disconnected from waiting room'
                });
            }
            else {
                // let other user know they are alone:((()
                socket.to(matchRoom).emit('match-terminated');
                godview.emit('log', {
                    room: matchRoom,
                    user: socket.id,
                    message: 'disconnected from active room'
                });

                // Room is no longer active once a player leaves
                let index = activeRoomIndex(matchRoom);
                if (index >= 0) {
                    activeRooms.splice(index, 1);
                }
            }
        }
    });

    socket.on('question-answered', (answer) => {
        sendQuestions(positionInRoom);
    })

    // Relay chat and typing events to the other user
    socket.on('chat-message', (data) => {
        socket.to(matchRoom).emit('chat-message', (data));
        godview.emit('log', {
            room: matchRoom,
            user: socket.id,
            message: data
        });
    });

    socket.on('typing', () => {
        socket.to(matchRoom).emit('typing', true);
    });

    socket.on('stopTyping', () => {
        socket.to(matchRoom).emit('stopTyping');
    });

});