import { expect } from 'chai';
import os from 'os';

import NodeGDB from '../src/node-gdbmi';
import config from './config.json';

let GDB_LOCATION = config.gdbLocation;
if (os.platform() === 'win32') {
  GDB_LOCATION = 'test/win/arm-none-eabi-gdb.exe';
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