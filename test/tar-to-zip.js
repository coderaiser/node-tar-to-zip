'use strict';

const {once} = require('events');

const fs = require('fs');
const path = require('path');
const os = require('os');

const through2 = require('through2');
const test = require('supertape');
const mockRequire = require('mock-require');
const {reRequire, stopAll} = mockRequire;

const tar2zip = require('..');

const noop = () => {};

const getFixtureTar = () => {
    return path.join(__dirname, 'fixture/fixture.tar.gz');
};

const getFixtureTar2 = () => {
    return path.join(__dirname, 'fixture/fixture2.tar.gz');
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
        progress: true,
    });
    
    t.throws(fn, /Could not use "progress" option when type of file is stream!/, 'should throw when no args');
    t.end();
});

test('tar2zip: filename: error: file is absent', async (t) => {
    const [e] = await once(tar2zip(getFixtureTar() + '1'), 'error');
    t.ok(/ENOENT/.test(e.message), 'should emit error when can not file file');
    t.end();
});

test('tar2zip: filename: error: not a tar', async (t) => {
    const expect = 'Unexpected end of data';
    const [e] = await once(tar2zip(getFixtureText()), 'error');
    t.equal(e.message, expect, 'should emit error when can not find a file');
    t.end();
});

test('tar2zip: can not untar file', async (t) => {
    const error = 'tar error';
    const extract = () => through2((enc, chunk, fn) => fn(error));
    
    mockRequire('tar-stream', {
        extract,
    });
    
    const tar2zip = reRequire('..');
    
    const progress = true;
    const emitter = tar2zip(getFixtureTar(), {progress});
    
    const [e] = await once(emitter, 'error');
    
    stopAll();
    
    t.equal(e, error, 'should be equal');
    t.end();
});

test('tar2zip: filename: progress', async (t) => {
    const progress = true;
    
    const emitter = tar2zip(getFixtureTar(), {
        progress,
    });
    
    const [n] = await once(emitter, 'progress');
    
    t.equal(n, 100, 'should emit progress');
    t.end();
});

test('tar2zip: files: zip: big file: same progress', async (t) => {
    const zipName = path.join(os.tmpdir(), String(Math.random()));
    const zipStream = fs.createWriteStream(zipName);
    
    const progress = true;
    const emitter = tar2zip(getFixtureTar2(), {progress});
    
    let i = 0;
    while (i < 100)
        [i] = await once(emitter, 'progress');
    
    await once(emitter.getStream().pipe(zipStream), 'finish');
    fs.unlinkSync(zipName);
    
    t.equal(i, 100, 'should be progress 100');
    t.end();
});

test('tar2zip: filename: filter: wrong type', (t) => {
    const fn = () => tar2zip(getFixtureTar(), {
        filter: 'test',
    });
    
    t.throws(fn, /filter should be a function!/, 'should throw then not a function');
    t.end();
});

test('tar2zip: filename: filter: filter all', async (t) => {
    const filter = () => false;
    const expect = 'No entries found in the tar stream';
    
    const [e] = await once(tar2zip(getFixtureTar(), {
        filter,
    }), 'error');
    
    t.equal(e.message, expect, 'should emit error when can not file file');
    t.end();
});

test('tar2zip: filename: map: wrong type', (t) => {
    const fn = () => tar2zip(getFixtureTar(), {
        map: 'test',
    });
    
    t.throws(fn, /map should be a function!/, 'should throw then not a function');
    t.end();
});

test('tar2zip: filename: map: change path', async (t) => {
    const map = (header) => {
        header.name = 'sub/' + header.name;
        return header;
    };
    
    await once(tar2zip(getFixtureTar(), {
        map,
    }).on('file', (file) => {
        t.equal(file, 'sub/fixture.txt', 'should change path');
    }).getStream(), 'finish');
    
    t.end();
});

test('tar2zip: stream: error: not a tar', async (t) => {
    const expect = 'Unexpected end of data';
    const [e] = await once(tar2zip(getFixtureTextStream()), 'error');
    
    t.equal(e.message, expect, 'should emit error when can not file file');
    t.end();
});

test('tar2zip: stream', async (t) => {
    await once(tar2zip(getFixtureTarStream()).getStream(), 'finish');
    
    t.pass('should emit finish');
    t.end();
});

test('tar2zip: stream: directory', async (t) => {
    await once(tar2zip(getFixtureTarDirStream()).getStream(), 'finish');
    
    t.pass('should emit finish');
    t.end();
});

