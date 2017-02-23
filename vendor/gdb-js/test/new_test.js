import mocha from 'mocha';
import { expect } from 'chai';
import os from 'os';

import NodeGDB from '../src/node-gdb';
const file = './app.ino.elf';
let gdbLocation = null;

os.platform() === 'win32' ? gdbLocation = 'C:\\Program Files (x86)\\Atmel\\Studio\\7.0\\toolchain\\arm\\arm-gnu-toolchain\\bin\\arm-none-eabi-gdb.exe' : 'gdb';

describe('GDB base', () => {

    let GDB = null;

    before((done) => {
        GDB = new NodeGDB({
            command: gdbLocation
        });
        done();
    })

    it('should be able to connect', async() => {
        const ret = await GDB.start();
        expect(ret.state).to.equal('done');
    });

    it('should be able to stop', async() => {
        const ret = await GDB.stop();
        expect(ret.state).to.equal('exit');
    });

    after((done) => {
        GDB = null;
        done();
    });
});