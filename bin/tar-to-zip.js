#!/usr/bin/env node

'use strict';

const args = process.argv.slice(2)
const arg = args[0];

const isTTY = process.stdin.isTTY;

if (/^(-v|--version)$/.test(arg))
    version();
else if (!arg && isTTY || /^(-h|--help)$/.test(arg))
    help();
else if (args.length)
    require('itchy/legacy')(args, main, exitIfError);
else
    require('..')(process.stdin)
        .getStream()
        .on('error', exitIfError)
        .pipe(process.stdout);

function getTarPath(name) {
    if (/^(\/|~)/.test(name))
        return name;
    
    const cwd = process.cwd();
    return cwd + '/' + name;
}

function getZipPath(name) {
    const reg = /\.(tar(\.gz)?|tgz)$/;
    
    if (reg.test(name))
        return name.replace(reg, '.zip');
    
    return name + '.zip';
}

function main(name, done) {
    const tarToZip = require('..');
    const fs = require('fs');
    
    const onProgress = (n) => {
        process.stdout.write(`\r${n}%: ${name}`);
    };
    
    const onFinish = () => {
        process.stdout.write('\n');
        done();
    };
    
    const pathTar = getTarPath(name);
    
    const pathZip = getZipPath(pathTar);
    const zip = fs.createWriteStream(pathZip)
        .on('error', (e) => {
            fs.unlinkSync(pathZip);
            exitIfError(e);
        });
    
    const progress = true;
    
    tarToZip(pathTar, {progress})
        .on('progress', onProgress)
        .getStream()
        .pipe(zip)
        .on('finish', onFinish);
}

function exitIfError(e) {
    if (!e)
        return;
    
    console.error(e.message);
    process.exit(1);
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

