const gulp = require("gulp");
const eslint = require('gulp-eslint');
const tslint = require("gulp-tslint");
const gutil = require("gulp-util");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const webpack = require("webpack");
const runSequence = require('run-sequence');
const del = require('del');

const fs = require("fs");
const fsp = require('fs-plus');
const path = require("path");
const childProcess = require("child_process");

//...
gulp.task("tslint", () => {
    return gulp.src(["**/*.ts", "**/*.tsx", "!**/*.d.ts", "!node_modules/**", "!./src/views/node_modules/**"])
        .pipe(tslint())
        .pipe(tslint.report());
});

gulp.task("eslint", () => {
    return gulp.src(["./vendor/**/*.js", "!**/node_modules/**"])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task("html-webpack", (done) => {
    const config = require("./src/views/webpack.config.js");
    config.context = `${__dirname}/src/views`;
    return webpack(config, (err, stats) => {
        const statsJson = stats.toJson();
        if (err || (statsJson.errors && statsJson.errors.length)) {
            statsJson.errors.forEach(webpackError => {
                gutil.log(gutil.colors.red(`Error (webpack): ${webpackError}`));
            });

            throw new gutil.PluginError('webpack', JSON.stringify(err || statsJson.errors));
        }
        gutil.log('[webpack]', stats.toString());
        done();
    });
});

gulp.task("node_modules-webpack", (done) => {
    const config = require("./webpack.config.js");
    config.context = `${__dirname}`;
    return webpack(config, (err, stats) => {
        const statsJson = stats.toJson();
        if (err || (statsJson.errors && statsJson.errors.length)) {
            statsJson.errors.forEach(webpackError => {
                gutil.log(gutil.colors.red(`Error (webpack): ${webpackError}`));
            });

            throw new gutil.PluginError('webpack', JSON.stringify(err || statsJson.errors));
        }
        gutil.log('[webpack]', stats.toString());
        done();
    });
});

gulp.task("ts-compile", () => {
    const tsProject = ts.createProject("./tsconfig.json");
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write(".", {
            mapSources: (sourcePath, file) => {
                // Correct source map path.
                const relativeSourcePath = path.relative(path.dirname(file.path), path.join(file.base, sourcePath));
                return relativeSourcePath;
            }
        }))
        .pipe(gulp.dest("out"));
});

gulp.task("clean", (done) => {
    return del('out', done);
});

gulp.task("genAikey", (done) => {
    if (process.env.TRAVIS_TAG) {
        const ISPROD = /^v?[0-9]+\.[0-9]+\.[0-9]+$/.test(process.env.TRAVIS_TAG || "");
        const packageJson = JSON.parse(fs.readFileSync("package.json"));
        if (ISPROD) {
            packageJson.aiKey = process.env["PROD_AIKEY"];
        } else {
            packageJson.aiKey = process.env["INT_AIKEY"] || packageJson.aiKey;
        }
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2) + "\n");
        done();
    } else {
        gutil.log("Skipping genAiKey");
    }
});

gulp.task("copyVendor", (done) => {
    fsp.copySync('vendor', 'out/vendor');
    done();
});

gulp.task("test", (done) => {
    function removeExtensionDependencies() {
        const packageJson = JSON.parse(fs.readFileSync("package.json"));
        packageJson.extensionDependencies = [];
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2) + "\n");
    }
    function restoreExtensionDependencies() {
        const packageJson = JSON.parse(fs.readFileSync("package.json"));
        packageJson.extensionDependencies = ["ms-vscode.cpptools"];
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2) + "\n");
    }

    // When using cli command "npm test" to exec test, the depended extensions (cpptools) are not available so that
    // the extension cannot be activated. As a workaround, remove extensionDependencies from package.json before running test
    // and restore extensionDependencies after test exited.
    removeExtensionDependencies();

    const child = childProcess.spawn("node", ["./node_modules/vscode/bin/test"], {
        cwd: __dirname,
        env: Object.assign({}, process.env, { CODE_TESTS_WORKSPACE: path.join(__dirname, "test/resources/blink") }),
    });

    child.stdout.on("data", (data) => {
        gutil.log(data.toString().trim());
    });

    child.stderr.on("data", (data) => {
        gutil.log(gutil.colors.red(data.toString().trim()));
    });

    child.on("error", (error) => {
        gutil.log(gutil.colors.red(error));
    });

    child.on("exit", (code) => {
        restoreExtensionDependencies();
        if (code === 0) {
            done();
        } else {
            gutil.log("exit code: " + code);
            done(code);
        }
    });
});

gulp.task("build", (done) => {
    return runSequence("clean", "ts-compile", "html-webpack", "node_modules-webpack", "copyVendor", done);
});

gulp.task("build_without_view", (done) => {
    return runSequence("clean", "ts-compile", done);
});

gulp.task("watch", () => {
    gulp.watch(["./src/**/*", "./test/**/*", "!./src/views/**/*"], ["ts-compile"]);
    gulp.watch(["./src/views/**/*", "!./src/views/node_modules/**"], ["html-webpack"]);
});