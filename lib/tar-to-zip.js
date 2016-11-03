'use strict';

const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;

const tarStream = require('tar-stream');
const yazl = require('yazl');

inherits(TarToZip, EventEmitter);

module.exports = (file) => {
    const emitter = new TarToZip(file);
    
    process.nextTick(() => {
        emitter.convert(file);
    });
    
    return emitter;
};

function TarToZip(file, options = {}) {
    EventEmitter.call(this);
    
    this._zip = new yazl.ZipFile();
    this.getStream = () => {
        return this._zip.outputStream;
    };
    
    this._n = 0;
    this._i = 0;
    this._percent = 0;
    this._percentPrev = 0;
    
    if (options.progress)
        this._parse();
}

TarToZip.prototype._progress = function() {
    ++this._i;
    
    const value = Math.round(this._i * 100 / this._n);
    
    this._percent = value;
    
    if (value !== this._percentPrev) {
        this._percentPrev = value;
        this.emit('progress', value);
    }
};

TarToZip.prototype.convert = function(file){
    const tar = tarStream.extract();
    const zip = this._zip;
    let end;
    
    tar.on('entry', (header, stream, next) => {
        const type = header.type;
        const name = header.name;
        
        ++this._n;
        
        stream.on('end', () => {
            this.emit('file', name);
            
            if (!end)
                return ++this._i;
            
            this._progress();
        });
        
        if (type === 'directory') {
            ++this._i;
            zip.addEmptyDirectory(name);
        } else {
            zip.addReadStream(stream, header.name)
        }
        
        next();
    });
    
    tar.on('finish', () => {
        end = true;
        zip.end();
    });
    
    file.pipe(tar);
};

