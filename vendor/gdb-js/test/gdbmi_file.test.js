import { expect } from 'chai';
import os from 'os';

import NodeGDB from '../src/node-gdbmi';
import config from './config.json';

const TEST_BIN_FILE = config.testBinFile;

let GDB_LOCATION = 'gdb';
if (os.platform() === 'win32') {
  GDB_LOCATION = 'test/win/arm-none-eabi-gdb.exe';
}

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