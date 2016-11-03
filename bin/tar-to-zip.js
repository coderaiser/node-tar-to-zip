#!/usr/bin/env node

'use strict';

const arg = process.argv
    .slice(2)
    .pop();

if (/^(-v|--version)$/.test(arg))
    version();
else if (/^(-h|--help)$/.test(arg))
    help();
else
    main(arg);

function getTarPath(name) {
    if (/^(\/|~)/.test(name))
        return name;
    
    const cwd = process.cwd();
    return cwd + '/' + name;
}

function getZipPath(name) {
    if (/\.tar$/.test(name))
        return name.replace(/\.tar$/, '.zip');
    
    return name + '.zip';
}

function main(name {
    const tarToZip = require('..');
    const fs = require('fs');
    
    const pathTar = getTarPath(name);
    const tar = fs.createReadStream(file)
        .on('error', console.log);
    
    const pathZip = getZipPath(pathTar);
    const zip = fs.createWriteStream(pathZip)
        .on('error', console.log);
    
    tarToZip(tar)
        .on('progress', (n) => {
            process.stdout.write(`\r${n}`);
        })
        .getStream()
        .pipe(zip)
        .on('finish', () => {
            process.stdout.write('\n');
        });
}

function version() {
    console.log('v' + info().version);
}

function info() {
    return require('../package');
}

function help() {
    const bin = require('../help');
    const usage = `Usage: ${info().name} [path]`;
    
    console.log(usage);
    console.log('Options:');
    
    Object.keys(bin).forEach((name) => {
        console.log(`  ${name} ${bin[name]}`);
    });
}

