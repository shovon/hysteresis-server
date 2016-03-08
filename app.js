const express = require('express');
const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const commander = require('commander');
const mkdirp = require('mkdirp');

commander
  .version('0.0.0')
  .option('-a, --assetspath <path>', 'Set the asset path')
  .option('-r, --receivedpath <path>', 'Set the asset path')
  .parse(process.argv);

const assetsPath = commander.assetspath || 'assets';
const receivedPath = path.resolve(
  process.cwd(),
  commander.receivedpath || 'received'
);

const monitorPath = path.resolve(process.cwd(), assetsPath);

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

/**
 * Saves the client's state.
 */
// TODO: unit test this.
function saveClientState(filename, state) {
  return new Promise((resolve, reject) => {
    if (!/^([a-z]|\-$)+/i.test(filename)) {
      throw new Error('Bad filename');
    }

    mkdirp(receivedPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  }).then(() => {
    return new Promise((resolve, reject) => {
      const stateJSON = typeof state === 'object' ?
        JSON.stringify(state) : JSON.stringify({ invalidObject: state.toString() });
      fs.writeFile(path.resolve(receivedPath, `${filename}.json`), stateJSON, 'utf8', (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

io.on('connection', (socket) => {
  socket.on('restore model', (msg) => {
    console.log(msg);
  });

  socket.on('send state', (msg) => {
    /**
     * msg properties:
     *
     *   filename: string representing the name (no extension)
     *   payload: JSON document
     */

    if (typeof msg.filename !== 'string' || typeof msg.payload !== 'object') {
      console.log('A bad payload was sent!');
      return;
    }
    if (!/^([a-z]|\-$)+/i.test(msg.filename)) {
      console.log('Bad filename was sent!');
      return;
    }
    saveClientState(msg.filename, msg.payload);
  });
});

chokidar.watch(monitorPath).on('add', (filepath) => {
  fsEvent('add', filepath);
});

app.use(cors());
app.use(express.static(path.resolve(__dirname, 'public')))

app.get('/files', (req, res, next) => {
  res.json(Object.keys(files));
});

app.get('/files/:id', function (req, res, next) {
  var filepath = path.resolve(monitorPath, req.params['id']);
  res.sendFile(filepath);
});

server.listen(3200, function () {
  console.log(this.address());
});
