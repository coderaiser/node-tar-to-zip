# Tar-to-Zip [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

Convert tar and tar.gz archives to zip.

## Global

`tar-to-zip` could be installed globally with and used as `tar-to-zip` or `tar2zip`:

```
npm i tar-to-zip -g
```

### Usage

Convert `tar` (or `tar.gz`) archive to `zip` in same directory:

```
tar2zip arc.tar.gz
```

> Make every program a filter
(c) Mike Gancarz: The UNIX Philosophy

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

## tarToZip(filename, options)

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
    console.error(message)
};

const zip = fs.createWriteStream('file.zip');
const progress = true;

tarToZip('file.tar.gz', {progress})
    .on('progress', onProgress)
    .on('file', console.log)
    .on('error', onError);
    .getStream()
    .pipe(zip)
    .on('finish', onFinish);

```

## tarToZip(stream)

- `stream` - **ReadableStream** stream with `tar` data.

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

tarToZip(tar, {progress})
    .on('file', console.log)
    .on('error', onError);
    .getStream()
    .pipe(zip)
    .on('finish', onFinish);
```

## Environments

In old `node.js` environments that not fully supports `es2015`, `tar-to-zip` could be used with:

```js
var tarToZip = require('tar-to-zip/legacy');
```
## Related

- [Jaguar](https://github.com/coderaiser/node-jaguar "Jaguar") - Pack and extract .tar.gz archives with emitter.
- [OneZip](https://github.com/coderaiser/node-onezip "OneZip") - Pack and extract zip archives with emitter.

## License

MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/tar-to-zip.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/node-tar-to-zip/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/coderaiser/node-tar-to-zip.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPMURL]:                   https://npmjs.org/package/tar-to-zip "npm"
[BuildStatusURL]:           https://travis-ci.org/coderaiser/node-tar-to-zip  "Build Status"
[DependencyStatusURL]:      https://gemnasium.com/coderaiser/node-tar-to-zip "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

[CoverageURL]:              https://coveralls.io/github/coderaiser/node-tar-to-zip?branch=master
[CoverageIMGURL]:           https://coveralls.io/repos/coderaiser/node-tar-to-zip/badge.svg?branch=master&service=github
