import { Server } from 'socket.io';

export const socketIOPlugin = () => {
  return {
    name: 'socket-io-plugin',
    configureServer(server) {
      if (!server.httpServer) return;
      
      const io = new Server(server.httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      let hostSocket = null;
      let clientSocket = null;

      io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('register_host', () => {
          hostSocket = socket;
          console.log('Host registered:', socket.id);
          // If a client is already waiting (rare in this flow but possible), notify host
          if (clientSocket) {
             hostSocket.emit('player_connected');
             clientSocket.emit('connected_to_host');
          }
        });

        socket.on('register_client', () => {
          clientSocket = socket;
          console.log('Client registered:', socket.id);
          if (hostSocket) {
            hostSocket.emit('player_connected');
            socket.emit('connected_to_host');
          } else {
            socket.emit('error_message', 'Host not found. Please wait for host to create game.');
          }
        });

        // Relay messages
        // SYNC: Host -> Client
        socket.on('SYNC', (data) => {
           if (socket === hostSocket && clientSocket) {
             clientSocket.emit('SYNC', data);
           }
        });

        // INPUT: Client -> Host
        socket.on('INPUT', (data) => {
          if (socket === clientSocket && hostSocket) {
            hostSocket.emit('INPUT', data);
          }
        });
        
        // General relay (START, RESET)
        socket.on('GAME_EVENT', (data) => {
           socket.broadcast.emit('GAME_EVENT', data);
        });

        socket.on('disconnect', () => {
          console.log('User disconnected:', socket.id);
          if (socket === hostSocket) {
            hostSocket = null;
            if (clientSocket) clientSocket.emit('host_disconnected');
          }
          if (socket === clientSocket) {
             clientSocket = null;
             if (hostSocket) hostSocket.emit('client_disconnected');
          }
        });
      });
    }
  };
};

