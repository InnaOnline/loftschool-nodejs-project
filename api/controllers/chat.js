module.exports = (io) => {
    let users = {}
    let messages = []
    io.sockets
        .on('connection', (socket) => {
            let socketId = socket.id;
            let user = null;
            const usersArray = () => Object.values(users).filter(u => u.userId !== user.userId)

            socket.on('users:connect', (data) => {
                user = {
                    socketId,
                    userId: data.userId,
                    username: data.username
                }
                users[socketId] = user;
                console.log('User connected to chat: ', user);
                socket.emit('users:list', usersArray());
                socket.broadcast.emit('users:add', user);
            })

            socket.on('message:history', data => {
                console.log('message:history', data)

                const history = messages.filter(msg =>
                    (msg.senderId === data.recipientId || msg.senderId === data.userId)
                    && (msg.recipientId === data.recipientId || msg.recipientId === data.userId))
        
                socket.emit('message:history', history)
            })

            socket.on('message:add', (data) => {
                messages.push(data);
                socket.emit('message:add', data);
                io.to(data.roomId).emit('message:add', data, socketId);
            });

            socket.on('disconnect', (data) => {
                console.log('User disconnected from chat: ' + socketId);
                delete users[socketId]

                socket.broadcast.emit('users:leave', socketId);
            });
        })
}
