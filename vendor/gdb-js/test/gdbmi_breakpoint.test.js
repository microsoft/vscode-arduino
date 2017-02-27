import { expect } from 'chai';
import os from 'os';

import NodeGDB from '../src/node-gdbmi';
import config from './config.json';

const TEST_BIN_FILE = config.testBinFile;
const BREAKPOINTS = config.breakPoints;
const ILLEGAL_BREAKPOINT = config.illegalBreakPoint;

let GDB_LOCATION = config.gdbLocation[os.platform()];

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
    const ret = await GDB.addBreakPoint(BREAKPOINTS[0]);
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
    await GDB.addBreakPoint(BREAKPOINTS[0]);
    const ret = await GDB.clearBreakPoints();
    expect(ret.state).to.equal('done');
  });

  it('should be able to remove breakpoint according index', async() => {
    await GDB.addBreakPoint(BREAKPOINTS[0]);
    const ret = await GDB.removeBreakPoint(1);
    expect(ret.state).to.equal('done');
  });

  it('should throw error if param of removeBreakPoint is not given', () => {
    expect(() => {GDB.removeBreakPoint()}).to.throw(Error);
  });

  it('should be able to add mutiple breakpoints & list breakpoint', async() => {
    await GDB.addBreakPoints(BREAKPOINTS);
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