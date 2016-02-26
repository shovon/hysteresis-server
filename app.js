const express = require('express');
const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
const socketio = require('socket.io');

const monitorPath = path.resolve(__dirname, 'assets');

const files = {};

const app = express();

const io = socketio(app);
chokidar.watch(monitorPath).on('all', (event, filepath) => {
  if (path.dirname(filepath) !== monitorPath) {
    return;
  }
  const filename = path.basename(filepath);
  const noext = filename.slice(0, filename.length - path.extname(filename).length);
  files[noext] = true;
  io.emit('file changed', '');
});

app.get('/files', (req, res, next) => {
  res.json(Object.keys(files));
});

app.listen(3000, function () {
  console.log(this.address());
});
