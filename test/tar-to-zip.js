'use strict';

const fs = require('fs');
const path = require('path');

const test = require('tape');
const tar2zip = require('..');

const noop = () => {};

const getFixtureTar = (str = '') => {
    return path.join(__dirname, 'fixture/fixture.tar.gz' + str);
};

const getFixtureTarDir = (str = '') => {
    return path.join(__dirname, 'fixture/fixture.dir.tar.gz' + str);
};

const getFixtureText = () => {
    return path.join(__dirname, 'fixture/fixture.txt');
};

const getFixtureTextStream = () => {
    return fs.createReadStream(getFixtureText());
};

const getFixtureTarStream = () => {
    return fs.createReadStream(getFixtureTarDir());
};

const getFixtureTarDirStream = () => {
    return fs.createReadStream(getFixtureTar());
};

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

test('tar2zip: filename: error: file is absent', (t) => {
    tar2zip(getFixtureTar('1'))
        .on('error', (e) => {
            t.ok(/ENOENT/.test(e.message), 'should emit error when can not file file');
            t.end();
        });
});

test('tar2zip: filename: error: not a tar', (t) => {
    const expect = 'No entries found in the tar stream';
    
    tar2zip(getFixtureText())
        .on('error', (e) => {
            t.equal(e.message, expect, 'should emit error when can not file file');
            t.end();
        });
});

test('tar2zip: filename: progress', (t) => {
    const progress = true;
    
    tar2zip(getFixtureTar(), {progress})
        .on('progress', (n) => {
            t.equal(n, 100, 'should emit progress');
        })
        .getStream()
        .on('finish', () => {
            t.end();
        });
});

test('tar2zip: filename: map: wrong type', (t) => {
    const fn = () => tar2zip(getFixtureTar(), {
        map: 'test'
    });
    
    t.throws(fn, /map should be a function!/, 'should throw then not a function');
    t.end();
});

test('tar2zip: filename: map: filter all', (t) => {
    const map = () => false;
    const expect = 'No entries found in the tar stream';
    
    tar2zip(getFixtureTar(), {map})
        .on('error', (e) => {
            t.equal(e.message, expect, 'should emit error when can not file file');
            t.end();
        });
});

test('tar2zip: filename: map: change path', (t) => {
    const map = (header) => {
        header.name = 'sub/' + header.name;
        return header;
    };
    
    tar2zip(getFixtureTar(), {map})
        .on('file', (file) => {
            t.equal(file, 'sub/fixture.txt', 'should change path');
        })
        .getStream()
        .on('finish', () => {
            t.end();
        });
});

test('tar2zip: stream: error: not a tar', (t) => {
    const expect = 'No entries found in the tar stream';
    
    tar2zip(getFixtureTextStream())
        .on('error', (e) => {
            t.equal(e.message, expect, 'should emit error when can not file file');
            t.end();
        });
});

test('tar2zip: stream', (t) => {
    tar2zip(getFixtureTarStream())
        .getStream()
        .on('finish', (e) => {
            t.pass('should emit finish');
            t.end();
        });
});

test('tar2zip: stream: directory', (t) => {
    tar2zip(getFixtureTarDirStream())
        .getStream()
        .on('finish', (e) => {
            t.pass('should emit finish');
            t.end();
        });
});

