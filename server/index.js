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
        if (activeRooms[i].room_id === roomId) {
            return i;
        }
    }

    return -1;
}

let godview = io.of('/godview'); // Namespace for all access view

// Watch godview connection and give ability to kill a room
godview.on('connection', (socket) => {
    console.log(`Socket ${socket.id} entered godview`);
    socket.on('kill-room', (roomId) => {
        console.log(`Kill room ${roomId}`);

        io.in(roomId).clients((error, clients) => {
            if (error) {
                console.log(error);
            }

            for (let client of clients) {
                io.to(client).emit('room-killed');

                let clientSocket = io.sockets.connected[client];
                clientSocket.leave(roomId);
            }
        });
    });
});

io.on('connection', (socket) => {
    console.log(`New connection. Socket: ${socket.id}`);
    let roomId = ''; // the room this socket is connected to
    let positionInRoom = -1;
    let questionCounter = 0;

    let getRoom = () => {
        return activeRooms[activeRoomIndex(roomId)];
    };

    let sendQuestions = playerIndex => {
        let room = getRoom();

        let questions;
        if (questionCounter % 4 === 3) {
            questions = room.pooler.getNewQuestions(playerIndex, "interests");
        }
        else {
            questions = room.pooler.getNewQuestions(playerIndex, "appearance");
        }

        if (playerIndex === positionInRoom) {
            socket.emit('question-prompt', questions);
            questionCounter++;
        }
        else {
            socket.in(roomId).emit('question-prompt', questions);
        }
    };

    socket.on('use-question', data => {
        getRoom().pooler.useQuestion(data, positionInRoom);
    });

    socket.on('join-room', () => {
        // If someone is waiting for a match, put our new connection in this room
        if (openRooms.length > 0) {
            let openRoom = openRooms.shift(); // Shift returns first item of array and removes it
            socket.join(openRoom);
            roomId = openRoom;

            // Create a new active room
            let room = {
                room_id: roomId,
                currentRound: 0,
                pooler: new questions.Pooler(2),
                roomCode: Math.floor(100000 + Math.random() * 900000).toString(10) // Generate 6-digit code
            };

            activeRooms.push(room);

            io.in(roomId).emit('match-made', {
                roomId: roomId,
                code: room.roomCode,
                waiterId: socket.id
            });

            // position in room is 0; they are the first person to join the room
            positionInRoom = 1;

            // Start the first question
            sendQuestions(positionInRoom === 1 ? 0 : 1);

            console.log(`Socket ${socket.id} joined room ${room.room_id}.`);
        }
        else {
            // Generate random string for new room
            let newRoom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            openRooms.push(newRoom);

            // position in room is 0; they are the first person to join the room
            positionInRoom = 0;

            socket.join(newRoom);
            roomId = newRoom;

            console.log(`No open rooms found for ${socket.id}. Created new room id: ${roomId}`);
        }

        godview.emit('joined-room', {
            id: socket.id,
            room: roomId
        });
    });

    socket.on('disconnect', () => {
        // If player has no matchroom, they did not even click the start button yet so nothing matters
        if (roomId !== '') {
            let index = openRooms.indexOf(roomId);

            // If player was in open room (c.q. still alone), no worries 
            // just remove it from open rooms list
            if (index >= 0) {
                openRooms.splice(index, 1);
                godview.emit('log', {
                    room: roomId,
                    user: socket.id,
                    message: 'disconnected from waiting room'
                });
            }
            else {
                // let other user know they are alone:((()
                socket.to(roomId).emit('match-terminated');
                godview.emit('log', {
                    room: roomId,
                    user: socket.id,
                    message: 'disconnected from active room'
                });

                // Room is no longer active once a player leaves
                let index = activeRoomIndex(roomId);
                if (index >= 0) {
                    activeRooms.splice(index, 1);
                }
            }
        }

        console.log(`Disconnected socket ${socket.id}`);
    });

    socket.on('question-answered', answer => {
        sendQuestions(positionInRoom);
    });

    // Relay chat and typing events to the other user
    socket.on('chat-message', (data) => {
        socket.to(roomId).emit('chat-message', (data));
        godview.emit('log', {
            room: roomId,
            user: socket.id,
            message: data
        });
    });

    socket.on('typing', () => {
        socket.to(roomId).emit('typing', true);
    });

    socket.on('stopTyping', () => {
        socket.to(roomId).emit('stopTyping');
    });
});