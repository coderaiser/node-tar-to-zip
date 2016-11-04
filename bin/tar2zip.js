#!/usr/bin/env node

'use strict';

const arg = process.argv
    .slice(2)
    .pop();

const isTTY = process.stdin.isTTY;

if (/^(-v|--version)$/.test(arg))
    return version();
else if (!arg && isTTY || /^(-h|--help)$/.test(arg))
    return help();

const tarToZip = require('..');
const fs = require('fs');

main(arg);

function getTarPath(name) {
    if (/^(\/|~)/.test(name))
        return name;
    
    const cwd = process.cwd();
    return cwd + '/' + name;
}

function getZipPath(name) {
    const reg = /\.tar(\.gz)?$/;
    
    if (reg.test(name))
        return name.replace(reg, '.zip');
    
    return name + '.zip';
}

function main(name) {
    if (!name) {
        return tarToZip(process.stdin)
            .getStream()
            .on('error', console.log)
            .pipe(process.stdout);
    }
    
    const onError = (e) => {
        console.log(e.message);
    };
    
    const onProgress = (n) => {
        process.stdout.write(`\r${n}%`);
    };
    
    const onFinish = () => {
        process.stdout.write('\n');
    };
    
    const pathTar = getTarPath(name);
    
    const pathZip = getZipPath(pathTar);
    const zip = fs.createWriteStream(pathZip)
        .on('error', (e) => {
            onError(e);
            fs.unlinkSync(pathZip);
        });
    
    const progress = true;
    
    tarToZip(pathTar, {progress})
        .on('progress', onProgress)
        .getStream()
        .pipe(zip)
        .on('finish', onFinish);
}

function version() {
    console.log('v' + info().version);
}

function info() {
    return require('../package');
}

function help() {
    const bin = require('../help');
    const usage = `Usage: ${info().name} [filename]`;
    
    console.log(usage);
    console.log('Options:');
    
    Object.keys(bin).forEach((name) => {
        console.log(`  ${name} ${bin[name]}`);
    });
}

