const uuid = require('node-uuid');
const touch = require('touch');
const path = require('path');

const uid = uuid.v4();
const prefilename = path.resolve(__dirname, 'assets', uid);

touch.sync(prefilename + '.bmp');
touch.sync(prefilename + '.json');
