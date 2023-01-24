const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.urlencoded({extended: true}));
app.use(express.json());

const http = require('http').Server(app);
const cors = require('cors'); // allows communication between different domains

// allows us to configure a real-time connectoin on the server.
const socketIO = require('socket.io')(http, {
  cors: {
    origin: '<http://localhost:4000>',
  },
});

// 👇 Generate random string as the ID
const generateID = () => Math.random().toString(36).substring(2, 10);

let chatRooms = [
  // {
  //   id: generateID(),
  //   name: 'Novu Hangouts',
  //   messages: [
  //     {
  //       id: generateID(),
  //       text: 'Hello guys, welcome',
  //       time: '07:50',
  //       user: 'Tom',
  //     },
  //     {
  //       id: generateID(),
  //       text: 'Hi Tom, thank you! 😇',
  //       time: '08:50',
  //       user: 'David',
  //     },
  //   ],
  // },
];

socketIO.on('connection', socket => {
  console.log(`⚡ : ${socket.id} user just connected!`);

  socket.on('createRoom', roomName => {
    socket.join(roomName);
    // 👇 Adds the new group name to the chat rooms array
    chatRooms.unshift({id: generateID(), name: roomName, messages: []});
    console.log('new room created!');
    // 👇 Returns the updated chat rooms via another event
    socket.emit('roomList', chatRooms);
  });

  socket.on('findRoom', id => {
    // 👇 filters the array by the ID
    let result = chatRooms.filter(room => room.id === id);
    // 👇 Sends the messages to the app
    if (result) {
      socket.emit('foundRoom', result[0].messages);
    }
  });

  socket.on('newMessage', data => {
    // 👇 Destructing the property from the object
    const {room_id, message, user, timestamp} = data;

    // 👇 Finds the room where the message was sent
    let result = chatRooms.filter(room => room.id === room_id);

    // 👇 Create the data structure for the message
    const newMessage = {
      id: generateID(),
      text: message,
      user,
      time: `${timestamp.hour}:${timestamp.mins}`,
    };

    // Updates the chatroom messages
    socket.to(result[0].name).emit('roomMessage', newMessage);
    result[0].messages.push(newMessage);

    // Trigger the events to reflect the new changes
    socket.emit('roomList', chatRooms);
    socket.emit('foundRoom', result[0].messages);
  });
  socket.on('disconnect', () => {
    socket.disconnect();
    console.log('🔥: A user disconnected!');
  });
});

app.use(cors());

app.get('/api', (req, res) => {
  res.json(chatRooms);
});

http.listen(PORT, () => console.log(`Server listening on PORT ${PORT}`));
