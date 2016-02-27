const uuid = require('node-uuid');
const touch = require('touch');
const path = require('path');
const fs = require('fs');

const uid = uuid.v4();
const prefilename = path.resolve(__dirname, 'assets', uid);

touch.sync(prefilename + '.bmp');

fs.writeFileSync(prefilename + '.json', JSON.stringify({
  "uid": uuid,
  "cad_file": "C:/Users/Arefin/Documents/Hysteresis/json",
  "param_indices": [
    0,
    0,
    3,
    2,
    0,
    1,
    0,
    0
  ],
  "image": "json/0ee132b6-eabb-437e-8c89-138f686dd386.bmp"
}), 'utf8');
