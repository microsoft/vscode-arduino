import { expect } from 'chai';
import os from 'os';
import ChildProcess from 'child_process';

import NodeGDB from '../src/node-gdbmi';
import config from './config.json';

const DEVICE = config.device;
const INTERFACE = config.interface;

let GDB_LOCATION = config.gdbLocation[os.platform()];
let JLINK_GDB_SERVER = config.gdbServer[os.platform()];

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