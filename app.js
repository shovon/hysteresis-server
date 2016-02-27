const express = require('express');
const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const monitorPath = path.resolve(__dirname, 'assets');

const files = {};

const app = express();
const server = http.Server(app);

const io = socketio(server);

function fsEvent(name, filepath) {
  const extname = path.extname(filepath);
  if (
    path.dirname(filepath) !== monitorPath ||
    extname !== '.json'
  ) {
    return;
  }
  const filename = path.basename(filepath);
  const noext = filename.slice(0, filename.length - extname.length);
  files[noext] = true;
  switch (name) {
  case 'add':
    io.emit('file created', noext);
    break;
  case 'unlink':
    io.emit('file deleted', noexit);
    break;
  }
}

chokidar.watch(monitorPath).on('add', (filepath) => {
  fsEvent('add', filepath);
});

app.use(cors());

app.get('/files', (req, res, next) => {
  res.json(Object.keys(files));
});

app.get('/files/:id', function (req, res, next) {
  res.sendFile(path.resolve(__dirname, 'assets', req.params['id']));
});

server.listen(3000, function () {
  console.log(this.address());
});
