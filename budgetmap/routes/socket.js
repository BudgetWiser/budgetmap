
module.exports = function(io){
	var connectedUsers = 0;
	function filterNullValues (i) {
	  return (i!=null);
	}
	io.on('connection', function (socket) {
		connectedUsers++;
		io.emit("connectedUsers", connectedUsers);

		console.log("socket.io connection established!");
	  	socket.on('new issue', function (data) {
	  		console.log('broadcast new issue');
			socket.broadcast.emit('new issue', data);
		});
		socket.on('update issue', function (data){
			console.log('broadcast update issue');
			socket.broadcast.emit('update issue', data)
		});

		socket.on('new connection', function (data){
			console.log('broadcast new conn');
			socket.broadcast.emit('new connection', data);

		});

		socket.on('delete issue', function (data){
			console.log('broadcast delete issue');
			socket.broadcast.emit('delete issue', data);
		});
		socket.on('delete connection', function (data){
			console.log('broadcast delete connection');
			socket.broadcast.emit('delete connection', data);
		});
		socket.on('disconnect', function(socket){
			connectedUsers--;
			io.emit("connectedUsers", connectedUsers);
		});
	});

}