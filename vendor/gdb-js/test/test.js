import { expect } from 'chai';
import os from 'os';
import ChildProcess from 'child_process';

import NodeGDB from '../src/node-gdbmi';

const TEST_BIN_FILE = 'test/app.ino.elf';
const BREAKPOINT1 = {file: 'app.ino', line: 17};
const BREAKPOINT2 = {file: 'app.ino', line: 18};
const ILLEGAL_BREAKPOINT = {file: 'app.ino', line: 200};
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
    });

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
    });

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


describe('GDB breakpoint', async() => {

    let GDB = null;

    beforeEach(async () => {
        GDB = new NodeGDB({
            command: GDB_LOCATION
        });
        await GDB.start();
        await GDB.setFile(TEST_BIN_FILE);
    });

    it('should be able to add breakpoint', async() => {
        const ret = await GDB.addBreakPoint(BREAKPOINT1);
        expect(ret.state).to.equal('done');
    });

    it ('should throw error if param of addBreakPoint is wrong', () => {
        expect(() => {GDB.addBreakPoint()}).to.throw(Error);
        expect(() => {GDB.addBreakPoint({foo:'foo.ino', bar: 17})}).to.throw(Error);
    });

    it('should not be able to add illegal breakpoint', async() => {
        const ret = await GDB.addBreakPoint(ILLEGAL_BREAKPOINT);
        expect(ret.state).to.equal('error');
    });

    it('should be able to clear breakpoints', async() => {
        await GDB.addBreakPoint(BREAKPOINT1);
        const ret = await GDB.clearBreakPoints();
        expect(ret.state).to.equal('done');
    });

    it('should be able to remove breakpoint according index', async() => {
        await GDB.addBreakPoint(BREAKPOINT1);
        const ret = await GDB.removeBreakPoint(1);
        expect(ret.state).to.equal('done');
    });

    it('should throw error if param of removeBreakPoint is not given', () => {
        expect(() => {GDB.removeBreakPoint()}).to.throw(Error);
    });

    it('should be able to add mutiple breakpoints & list breakpoint', async() => {
        await GDB.addBreakPoints([BREAKPOINT1, BREAKPOINT2]);
        const ret = await GDB.listBreakPoints();
        expect(ret).to.deep.equal([
            {id: '1', file: 'app.ino', line: '17'},
            {id: '2', file: 'app.ino', line: '18'},
        ]);
    });

    afterEach(async () => {
        await GDB.stop();
        GDB = null;
    });
});