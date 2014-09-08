
module.exports = function(io){
	io.on('connection', function (socket) {
		console.log("socket.io connection established!");
	  	socket.on('new issue', function (data) {
	  		console.log('broadcast new issue');
			socket.broadcast.emit('update issue', data);
		});

		socket.on('new connection', function (data){
			console.log('broadcast new conn');
			socket.broadcast.emit('update connection', data);

		});
	});
}