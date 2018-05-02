'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const through2 = require('through2');
const test = require('tape');
const tar2zip = require('..');

const noop = () => {};

const getFixtureTar = () => {
    return path.join(__dirname, 'fixture/fixture.tar.gz');
};

const getFixtureTar2 = () => {
    return path.join(__dirname, 'fixture/fixture2.tar.gz');
};

const getFixtureZip2 = () => {
    return path.join(__dirname, 'fixture/fixture2.zip');
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
    tar2zip(getFixtureTar() + '1')
        .on('error', (e) => {
            t.ok(/ENOENT/.test(e.message), 'should emit error when can not file file');
            t.end();
        });
});

test('tar2zip: filename: error: not a tar', (t) => {
    const expect = 'Unexpected end of data';
    
    tar2zip(getFixtureText())
        .on('error', (e) => {
            t.equal(e.message, expect, 'should emit error when can not find a file');
            t.end();
        });
});

test('tar2zip: can not untar file', (t) => {
    const error = 'tar error';
    const extract = () => through2((enc, chunk, fn) => fn(error));
    
    clean('..');
    stub('tar-stream', {
        extract
    });
    
    const tar2zip = require('..');
    
    const progress = true;
    tar2zip(getFixtureTar(), {progress})
        .on('error', (e) => {
            t.equal(e, error, 'should be equal');
            
            clean('..');
            clean('tar-stream');
            
            require('..')
            t.end();
        })
        .getStream()
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

test('tar2zip: files: zip: big file: same progress', (t) => {
    const zipName = path.join(os.tmpdir(), String(Math.random()));
    const zipStream = fs.createWriteStream(zipName);
    
    const progress = true;
    
    let i = 0;
    
    tar2zip(getFixtureTar2(), {progress})
        .on('progress', (n) => {
            i = n;
        })
        .getStream()
        .on('finish', () => {
            t.equal(i, 100, 'should be progress 100');
            fs.unlinkSync(zipName);
            t.end();
        })
        .pipe(zipStream)
});

test('tar2zip: filename: filter: wrong type', (t) => {
    const fn = () => tar2zip(getFixtureTar(), {
        filter: 'test'
    });
    
    t.throws(fn, /filter should be a function!/, 'should throw then not a function');
    t.end();
});

test('tar2zip: filename: filter: filter all', (t) => {
    const filter = () => false;
    const expect = 'No entries found in the tar stream';
    
    tar2zip(getFixtureTar(), {filter})
        .on('error', (e) => {
            t.equal(e.message, expect, 'should emit error when can not file file');
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
    const expect = 'Unexpected end of data';
    
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

function clean(name) {
    delete require.cache[require.resolve(name)];
}

function stub(name, data) {
    require.cache[require.resolve(name)].exports = data;
}

