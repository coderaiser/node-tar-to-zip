'use strict';

const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Readable = require('stream').Readable;

const tarStream = require('tar-stream');
const gunzipMaybe = require('gunzip-maybe');
const yazl = require('yazl');
const pipe = require('pipe-io/legacy');

const isString = (a) => typeof a === 'string';
const isStream = (a) => a instanceof Readable;

inherits(TarToZip, EventEmitter);

module.exports = (file, options = {}) => {
    check(file, options);
    
    const isProgress = options.progress;
    const emitter = new TarToZip(file, options);
    
    process.nextTick(() => {
        const stream = getFile(file);
        
        if (!isProgress)
            emitter.convert(stream);
        else
            emitter._parse(stream, () => {
                emitter.convert(getFile(file));
            });
    });
    
    return emitter;
};

function TarToZip(file, options) {
    EventEmitter.call(this);
    
    this._zip = new yazl.ZipFile();
    this.getStream = () => {
        return this._zip.outputStream;
    };
    
    this._n = 0;
    this._i = 0;
    this._percent = 0;
    this._percentPrev = 0;
    
    this._isProgress = options.progress;
}

function getFile(file) {
    if (isStream(file))
        return file;
    
    return fs.createReadStream(file);
}

TarToZip.prototype._progress = function() {
    if (!this._isProgress)
        return;
    
    ++this._i;
    
    const value = Math.round(this._i * 100 / this._n);
    
    this._percent = value;
    
    if (value !== this._percentPrev) {
        this._percentPrev = value;
        this.emit('progress', value);
    }
};

TarToZip.prototype._parse = function(file, done){
    const tar = tarStream.extract();
    
    tar.on('entry', (header, stream, next) => {
        ++this._n;
        stream.resume();
        next();
    });
    
    const streams = [
        file,
        gunzipMaybe(),
        tar
    ];
    
    pipe(streams, (e) => {
        !e ? done() : this.emitError(e);
    });
};

TarToZip.prototype.emitError = function(error) {
    this.emit('error', error);
}

TarToZip.prototype.convert = function(file){
    const tar = tarStream.extract();
    const zip = this._zip;
    let isTar;
    
    tar.on('entry', (header, stream, next) => {
        if (!isTar)
            isTar = true;
        
        const type = header.type;
        const name = header.name;
        
        stream.on('end', () => {
            this.emit('file', name);
            this._progress();
        });
        
        if (type === 'directory') {
            this._progress();
            zip.addEmptyDirectory(name);
        } else {
            zip.addReadStream(stream, header.name)
        }
        
        next();
    });
    
    tar.on('finish', () => {
        if (isTar)
            return zip.end();
        
        const error = Error('No entries found in the tar stream');
        this.emitError(error);
    });
    
    const streams = [
        file,
        gunzipMaybe(),
        tar
    ];
    
    pipe(streams, (e) => {
        e && this.emitError(e);
    });
};

function check(file, options) {
    if (!file)
        throw Error('file could not be empty!');
    
    if (!isString(file) && !isStream(file))
        throw Error('file could be String or Readable Stream only!');
    
    if (isStream(file) && options.progress)
        throw Error('Could not use "progress" option when type of file is stream!');
}

