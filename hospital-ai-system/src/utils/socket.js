/**
 * Singleton wrapper around the Socket.io server instance.
 * Call init(httpServer) once in server.js, then getIO() anywhere else.
 */
let _io = null;

const init = (httpServer) => {
  const { Server } = require('socket.io');
  _io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  _io.on('connection', (socket) => {
    // Each authenticated client joins a room named after their userId
    socket.on('join', (userId) => {
      socket.join(userId);
    });

    socket.on('disconnect', () => {});
  });

  return _io;
};

const getIO = () => {
  if (!_io) throw new Error('Socket.io not initialised. Call init(httpServer) first.');
  return _io;
};

module.exports = { init, getIO };
