'use strict';

const fs = require('fs');

const test = require('tape');
const tar2zip = require('..');

const noop = () => {};

test('tar2zip: args: no', (t) => {
    t.throws(tar2zip, /file could not be empty!/, 'should throw when no file');
    t.end();
});

test('tar2zip: args: file: wrong type', (t) => {
    const fn = () => tar2zip(5);
    
    t.throws(fn, /file could be String or Readable Stream only!/, 'should throw when no args');
    t.end();
});

test('tar2zip: args: options: when file is stream', (t) => {
    const file = fs.createReadStream('hello')
        .on('error', noop);
    
    const fn = () => tar2zip(file, {
        progress: true
    });
    
    t.throws(fn, /Could not use "progress" option when type of file is stream!/, 'should throw when no args');
    t.end();
});

