$(document).ready(function () {
  let socket = io();
  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });

  // 17
  /*socket.on('user count', function(data) {
    console.log(data);
  });*/

  // 20
  socket.on('user', function(data) {
    $('#num-users').text(data.currentUsers + ' users online');
    let message = data.name + 
      (data.connected ? ' has joined the chat.' : ' has left the chat.');
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  // 21
  socket.on('chat message', function(data) {
    $('#messages').append('<li>').text(`${data.name}: ${data.message}`);
  });
  
});
