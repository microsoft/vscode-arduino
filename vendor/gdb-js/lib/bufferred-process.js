(function() {
    var BufferedProcess, child_process;

    child_process = require('child_process');

    BufferedProcess = (function() {
        BufferedProcess.prototype.partialLine = '';

        function BufferedProcess(arg, ok) {
            this.command = arg.command, this.args = arg.args, this.stdout = arg.stdout, this.exit = arg.exit;
        }

        BufferedProcess.prototype._spawn = function() {
            return new Promise((function(_this) {
                return function(resolve, reject) {
                    var error, ok;
                    _this.process = child_process.spawn(_this.command, _this.args);
                    _this.process.stdout.on('data', function(data) {
                        return _this._stdout(data);
                    });
                    ok = function() {
                        _this.process.removeListener('error', error);
                        return resolve(_this);
                    };
                    error = function(err) {
                        _this.process.stdout.removeListener('data', ok);
                        return reject(err);
                    };
                    _this.process.stdout.once('data', ok);
                    _this.process.once('error', error);
                    _this.process.on('exit', function() {
                        return _this.exit();
                    });
                    return _this.exitPromise = new Promise(function(resolve) {
                        return _this.process.on('exit', function() {
                            return resolve();
                        });
                    });
                };
            })(this));
        };

        BufferedProcess.prototype.stdin = function(line) {
            return this.process.stdin.write(line + '\n');
        };

        BufferedProcess.prototype._stdout = function(data) {
            var i, len, line, lines;
            data = this.partialLine + data.toString();
            lines = data.split('\n');
            this.partialLine = lines.slice(-1);
            lines = lines.slice(0, -1);
            for (i = 0, len = lines.length; i < len; i++) {
                line = lines[i];
                this.stdout(line);
            }
        };

        BufferedProcess.prototype.kill = function(signal) {
            this.process.kill(signal);
            return this.exitPromise;
        };

        return BufferedProcess;

    })();

    module.exports = function(options) {
        return new BufferedProcess(options)._spawn();
    };

}).call(this);