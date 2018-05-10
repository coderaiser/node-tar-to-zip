# tar-to-zip [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

Convert tar and tar.gz archives to zip.

## Global

`tar-to-zip` could be installed globally and used as `tar-to-zip` or `tar2zip`:

```
npm i tar-to-zip -g
```

### Usage

Convert all `tar.gz` archives to `zip` in same directory:

```
tar2zip *.tar.gz
```

> Make every program a filter
>
> (c) Mike Gancarz: The UNIX Philosophy

Convert `tar` data from `stdin` and pipe it to `stdout`.

```
cat arc.tar | tar2zip > arc.zip
```

## Local

`tar-to-zip` could be used localy. It will emit event on every file from converted archive.

## Install

```
npm i tar-to-zip --save
```

## API

`tar-to-zip` can work with `filename` and `ReadableStream`. When `filename` used `tar-to-zip` can emit
progress of coverting (with `options`: `{progress: true}`).

`tar-to-zip` can transform the files as they are being processed using `options`: `map` and `filter`.

### tarToZip(filename, {progress})

- `filename` - **string** name of the file
- `options` - **object** with properties:
  - `progress` - whether emit `progress` event.

```js
const tarToZip = require('tar-to-zip');
const fs = require('fs');
const {stdout} = process;

const onProgress = (n) => {
    stdout.write(`\r${n}`);
};

const onFinish = (e) => {
    stdout.write('\n');
};

const onError = ({message}) => {
    console.error(message);
};

const zip = fs.createWriteStream('file.zip');
const progress = true;

tarToZip('file.tar.gz', {progress})
    .on('progress', onProgress)
    .on('file', console.log)
    .on('error', onError)
    .getStream()
    .pipe(zip)
    .on('finish', onFinish);

```

### tarToZip(stream)

- `stream` - **ReadableStream** with `tar` data.

```js
const tarToZip = require('tar-to-zip');
const fs = require('fs');
const {stdout} = process;

const onProgress = (n) => {
    stdout.write(`\r${n}`);
};
const onFinish = (e) => {
    stdout.write('\n');
};

const onError = ({message}) => {
    console.error(message)
};

const tar = fs.createReadStream('file.tar.gz');
const zip = fs.createWriteStream('file.zip');
const progress = true;

tarToZip(tar, {progress})
    .on('progress', onProgress)
    .on('file', console.log)
    .on('error', onError)
    .getStream()
    .pipe(zip)
    .on('finish', onFinish);
```

### tarToZip(stream, {filter, map})

- `options` - **ReadableStream** with `tar` data.
  - `filter` - function to filter out files. Return `false` to exclude a file.
  - `map` - function to transform file name/type.

```js
const tarToZip = require('tar-to-zip');
const fs = require('fs');
const {stdout} = process;
const onProgress = (n) => {
    stdout.write(`\r${n}`);
};

const onFinish = (e) => {
    stdout.write('\n');
};

const onError = ({message}) => {
    console.error(message);
};

const zip = fs.createWriteStream('file.zip');
const progress = false;

// exclude all but example.txt
const filter = ({name}) => {
    return name === 'example.txt';
};

// replace all .txt extensions with .doc
const map = ({name}) => {
    return {
        name: name.replace(/\.txt$/, '.doc')
    };
};

tarToZip('file.tar.gz', {filter, map, progress})
    .on('progress', onProgress)
    .on('file', console.log)
    .on('error', onError)
    .getStream()
    .pipe(zip)
    .on('finish', onFinish);

```

## Related

- [Jag](https://github.com/coderaiser/node-jag "Jag") - Pack files and folders with tar and gzip.
- [Jaguar](https://github.com/coderaiser/node-jaguar "Jaguar") - Pack and extract .tar.gz archives with emitter.
- [OneZip](https://github.com/coderaiser/node-onezip "OneZip") - Pack and extract zip archives with emitter.
- [zip-to-tar](https://github.com/coderaiser/node-zip-to-tar "Zip To Tar") - Convert zip archives to tar.

## License

MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/tar-to-zip.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/node-tar-to-zip/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/david/coderaiser/node-tar-to-zip.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPMURL]:                   https://npmjs.org/package/tar-to-zip "npm"
[BuildStatusURL]:           https://travis-ci.org/coderaiser/node-tar-to-zip  "Build Status"
[DependencyStatusURL]:      https://david-dm.org/coderaiser/node-tar-to-zip "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

[CoverageURL]:              https://coveralls.io/github/coderaiser/node-tar-to-zip?branch=master
[CoverageIMGURL]:           https://coveralls.io/repos/coderaiser/node-tar-to-zip/badge.svg?branch=master&service=github

