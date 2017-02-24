import mocha from 'mocha';
import { expect } from 'chai';
import os from 'os';
import ChildProcess from 'child_process';

import NodeGDB from '../src/node-gdbmi';

const TEST_BIN_FILE = 'test/app.ino.elf';
const BREAKPOINT = {file: 'app.ino', line: 17};
const DEVICE = 'ATSAMD21G18';
const INTERFACE = 'SWD';
let GDB_LOCATION = 'gdb';
let JLINK_GDB_SERVER = 'JLinkGDBServer';


if (os.platform() === 'win32') {
    GDB_LOCATION = 'test/win/arm-none-eabi-gdb.exe';
    JLINK_GDB_SERVER = 'test/win/JLinkGDBServer.exe';
} 

describe('GDB base', () => {

    let GDB = null;

    before((done) => {
        GDB = new NodeGDB({
            command: GDB_LOCATION
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


describe('GDB remote', () => {

    let GDB = null;
    let GDBServer = null;
    const port = 2331;

    before(async () => {
        GDBServer = ChildProcess.spawn(JLINK_GDB_SERVER, ["-device", DEVICE, "-if", INTERFACE, "-port", port]);
        GDBServer.stdout.on('data', (data) => {
            console.log(`GDBServer stdout: ${data}`);
        });
        GDBServer.stderr.on('data', (data) => {
            console.log(`GDBServer stderr: ${data}`);
        });
        GDBServer.on("close", (code) => {
            console.log(`GDBServer child process exited with code ${code}`);
        });
        GDB = new NodeGDB({
            command: GDB_LOCATION
        });
        await GDB.start();
    });

    it('should be able to connect to JLink GDB server', async () => {
        const ret = await GDB.connectToGDBServer(port);
        expect(ret.state).to.equal('connected');
    });

    it('should be able to init remote option', async () => {
        const ret = await GDB.configRemoteOption();
        expect(ret).to.equal(true);
    })

    after(async () => {
        await GDB.stop();
        GDB = null;
        GDBServer.kill();
        GDBServer = null;
    });
});


describe('GDB file', () => {

    let GDB = null;

    before(async () => {
        GDB = new NodeGDB({
            command: GDB_LOCATION
        });
        await GDB.start();
    });

    it('should be able to set file', async () => {
        const ret = await GDB.setFile(TEST_BIN_FILE);
        expect(ret.state).to.equal('done');
    });

    after(async () => {
        await GDB.stop();
        GDB = null;
    });

});
