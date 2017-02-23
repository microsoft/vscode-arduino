import NodeGDB from '../out/node-gdb'
const file = '../test/app.ino.elf';
const breakPoint = 'app.ino:17';
const COUNT  = 500;
const gdbLocation = 'C:\\Program Files (x86)\\Atmel\\Studio\\7.0\\toolchain\\arm\\arm-gnu-toolchain\\bin\\arm-none-eabi-gdb.exe';

(async()=>{
    let gdb = new NodeGDB({
        command: gdbLocation
    });
    let timeout = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    let getState = () => {
        return gdb.state;
    };
    let waitToStop = async (seconds) => {
        while (getState() != 'stopped') {
            await timeout(1000);
            seconds --;
            if (seconds < 0 ) {
                console.log('wait timeout ');
                return;
            } else {
                if (seconds<5) {
                    gdb.pause();
                }
                console.log('wait util ', seconds);
            }
        }
    };


    let execute = async (cmd, descr) => {
        let r;
        if (cmd === 'cont') {
            r = await gdb.cont();
            console.log('cont', r);
        } else if (cmd === 'next') {
            r = await gdb.next();
            console.log('next', r);
        } else if (cmd === 'interrupt') {
            r = await gdb.pause();
            console.log('interrupt', r);
        } else {
            console.log(`${descr || cmd}...`);
            r = await gdb.send_cli(cmd);
            console.log(cmd, r);
            console.log(`${descr || cmd} completed`);
        }
    };

    gdb.emitter.on('connected', async () => {
        try {
            await execute('target remote :2331', 'connect');
            await execute(`file ${file}`, 'set file');

            await execute('monitor speed 500');
            await execute('load');
            await execute('monitor reset');
            await execute(`break ${breakPoint}`);
            await execute('cont');

            for (let i = 0; i < COUNT; i++){
                await waitToStop(10);
                await execute('cont');
            }
        } catch(err) {
            console.log(err);
        }
    });
    await gdb.start();
})().catch(err => console.log(err));