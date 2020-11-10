'use strict';

const fs = require('fs');
const {EventEmitter} = require('events');
const {inherits} = require('util');
const {Readable} = require('stream');

const tryToCatch = require('try-to-catch');
const tarStream = require('tar-stream');
const gunzipMaybe = require('gunzip-maybe');
const yazl = require('yazl');
const pipe = require('pipe-io');

const isString = (a) => typeof a === 'string';
const isStream = (a) => a instanceof Readable;
const isFunction = (a) => typeof a === 'function';

const defaultFilter = () => true;
const defaultMap = () => {};

inherits(TarToZip, EventEmitter);

module.exports = (file, options) => {
    options = options || {};
    
    check(file, options);
    
    const isProgress = options.progress;
    const emitter = new TarToZip(options);
    
    process.nextTick(() => {
        const stream = getFile(file);
        
        if (!isProgress)
            return emitter.convert(stream);
        
        emitter._parse(stream, () => {
            emitter.convert(getFile(file));
        });
    });
    
    return emitter;
};

function TarToZip(options) {
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
    this._filter = options.filter || defaultFilter;
    this._map = options.map || defaultMap;
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

TarToZip.prototype._parse = async function(file, done) {
    const tar = tarStream.extract();
    
    tar.on('entry', (header, stream, next) => {
        ++this._n;
        stream.resume();
        next();
    });
    
    const streams = [
        file,
        gunzipMaybe(),
        tar,
    ];
    
    const [e] = await tryToCatch(pipe, streams);
    !e ? done() : this.emitError(e);
};

TarToZip.prototype.emitError = function(error) {
    this.emit('error', error);
};

TarToZip.prototype.convert = async function(file) {
    const tar = tarStream.extract();
    const zip = this._zip;
    let isTar;
    
    tar.on('entry', (sourceHeader, stream, next) => {
        if (!this._filter(sourceHeader)) {
            this._progress();
            return next();
        }
        
        const header = Object.assign(sourceHeader, this._map(sourceHeader));
        
        const {
            type,
            name,
        } = header;
        
        if (!isTar)
            isTar = true;
        
        stream.on('end', () => {
            this.emit('file', name);
            this._progress();
        });
        
        if (type === 'directory') {
            this._progress();
            zip.addEmptyDirectory(name);
        } else {
            zip.addReadStream(stream, name);
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
        tar,
    ];
    
    const [e] = await tryToCatch(pipe, streams);
    e && this.emitError(e);
};

function check(file, options) {
    if (!file)
        throw Error('file could not be empty!');
    
    if (!isString(file) && !isStream(file))
        throw Error('file could be String or Readable Stream only!');
    
    if (isStream(file) && options.progress)
        throw Error('Could not use "progress" option when type of file is stream!');
    
    if (options.filter && !isFunction(options.filter))
        throw Error('filter should be a function!');
    
    if (options.map && !isFunction(options.map))
        throw Error('map should be a function!');
}

