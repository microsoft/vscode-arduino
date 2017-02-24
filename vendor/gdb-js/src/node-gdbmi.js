import {
    Emitter
} from 'event-kit'
import bufferedProcess from '../lib/bufferred-process'
import {
    parse
} from '../lib/parser.js';
const _clone = obj => {
    return Object.assign({}, obj);
};

const cstr = (s) => {
    let c, esc, i, len;
    esc = '';
    for (i = 0, len = s.length; i < len; i++) {
        c = s[i];
        switch (c) {
            case '"':
                c = '\\"';
                break;
            case '\\':
                c = '\\\\';
        }
        esc += c;
    }
    return "\"" + esc + "\"";
};

const trimEnd = (str, c) => {
    c = c ? c : ' ';
    let i = str.length - 1;
    for (; i >= 0 && str.charAt(i) == c; i--);
    return str.substring(0, i + 1);
};

export default class NodeGDB {
    constructor(opt) {
        this.emitter = new Emitter;
        this.opt = _clone(opt);
        this.next_token = 0;
        this.cmdq = [];
        this.state = '';
        this.remote = false;
    }

    async start() {
        if (this.child) {
            await this.child.kill();
        }
        this.child = await bufferedProcess({
            command: this.opt.command,
            args: ['-q', '-n', '--interpreter=mi'],
            stdout: this._line_output_handler.bind(this),
            exit: this._child_exited.bind(this)
        });
        let response = await this.send_mi('-gdb-set target-async on');
        if (response && response.state === 'done') {
            this.emitter.emit('connected');
            return response;
        } else {
            throw new Error("cannot set async mode!");
        }
    }

    send_mi(cmd, quiet) {
        if (!this.child) {
            throw new Error('Not connected');
        }
        return new Promise((resolve, reject) => {
            this.cmdq.push({
                quiet: quiet,
                cmd: this.next_token + cmd,
                resolve: resolve,
                reject: reject,
                token: this.next_token
            });
            this.next_token++;
            if (this.cmdq.length === 1) {
                return this._drain_queue();
            }
        });
    }
    send_cli(cmd) {
        cmd = cmd.trim();
        if (cmd.startsWith('#')) {
            return;
        }
        return this.send_mi("-interpreter-exec console " + (cstr(cmd)));
    }

    cont() {
        if (this.state === 'EXITED') {
            return this.send_mi('-exec-run');
        } else {
            return this.send_mi('-exec-continue');
        }
    }
    next() {
        return this.send_mi('-exec-next');
    }
    stop() {
        return this.send_mi('-gdb-exit');
    }
    async pause() {
        let t = setTimeout(() => {
            this.child.kill('SIGINT');
        }, 100);
        let res = await this.send_mi('-exec-interrupt');
        clearTimeout(t);
        return res;
    }

    async connectToGDBServer(port) {
        const res = await this.send_mi(`-target-select remote :${port}`);
        if (res.state === 'connected') {
            this.remote = true;
        }
        return res;
    }

    setFile(file) {
        return this.send_mi(`-file-exec-and-symbols ${file}`);
    }

    async configRemoteOption(speed = 'auto') {
        if (!this.remote) {
            console.log('monitor & load command should not be called if gdbserver is not used.');
            return false;
        }
        try {
            await this.send_cli(`monitor speed ${speed}`);
            await this.send_cli('monitor reset');
            await this.send_cli('load');
        } catch (error) {
            console.log('error', error);
        }
        return true;
    }

    addBreakPoint(breakpoint) {
        //TODO: check breakpoint already exist?
        if (!breakpoint || !breakpoint.file || !breakpoint.line) {
            throw new Error('file name and line number must be specified');
        }
        return this.send_mi(`-break-insert ${breakpoint.file}:${breakpoint.line}`);
    }

    removeBreakPoint(id) {
        if (id === undefined) {
            throw new Error('index of the breakpoint must be given');
        }
        return this.send_mi(`-break-delete ${id}`);
    }

    clearBreakPoints() {
        return this.send_mi('-break-delete');
    }

    async listBreakPoints() {
        const res = await this.send_mi('-break-list');
        if (!res || !res.data || !res.data.BreakpointTable || !res.data.BreakpointTable.body) {
            throw new Error('breakpoint list parse error');
        }
        let breakpoints = [];
        res.data.BreakpointTable.body.forEach(item => {
            let breakpoint = item.value;
            if (breakpoint && breakpoint['original-location']) {
                breakpoints.push({
                    id: breakpoint.number,
                    file: breakpoint['original-location'].substr(0, breakpoint['original-location'].indexOf(':')),
                    line: breakpoint.line,
                });
            }
        });
        return breakpoints;
    }

    loadBreakPoints(breakpoints) {
        const len = breakpoints.length;
        let promises = [];
        breakpoints.forEach(bp => {
            promises.push(this.addBreakPoint(bp));
        })
        Promise.all(promises).then(results => {
            results.forEach(res => {
                if (res.state !== 'done') {
                    console.log(`Error add breakpoint: ${res.data.msg}`);
                }
            })
        });
    }

    _drain_queue() {
        if (this.cmdq.length) {
            return this.child.stdin(this.cmdq[0].cmd);
        }
    }

    _flush_queue() {
        for (let i = 0; i < this.cmdq.length; i++) {
            this.cmdq[i].reject(new Error('Flushed due to previous errors'));
        }
        this.cmdq = [];
    }

    _line_output_handler(line) {
        let r;
        try {
            line = trimEnd(line, '\r');
            r = parse(line);
        } catch (error) {
            console.log('error', error);
        }

        if (r) {
            switch (r.type) {
                case 'console':
                    console.log('.', r.data);
                    break;
                case 'notify':
                    console.log('notify', r.state, r.data);
                    break;
                case 'exec':
                    if (r.state === 'running') {
                        console.log('exec', r.state);
                    } else {
                        console.log('exec', r.state, r.data.reason, r.data.frame.addr, r.data.frame.line);
                    }
                    this.state = r.state;
                    break;
                case 'prompt':
                    break;
                case 'result':
                    {
                        if (Number.isInteger(r.token)) {
                            let c = this.cmdq.shift();
                            if (c.token === r.token) {
                                c.resolve(r);
                            }
                            this._drain_queue();
                        }
                    }
                    break;
                default:
                    console.log(JSON.stringify(r, null, 4), line);
            }

        }
    }

    _child_exited() {
        this.emitter.emit('disconnected');
        this._flush_queue();
        delete this.child;
    }

    getState() {
        return this.state;
    }
}