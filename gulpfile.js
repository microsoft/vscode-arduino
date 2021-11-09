const gulp = require("gulp");
const eslint = require("gulp-eslint");
const tslint = require("gulp-tslint");
const PluginError = require("plugin-error");
const log = require("fancy-log");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const webpack = require("webpack");
const del = require("del");
const download = require("download");
const extract = require("extract-zip");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const argv = require("minimist")(process.argv.slice(2));

gulp.task("tslint", () => {
    return gulp.src(["**/*.ts", "**/*.tsx", "!**/*.d.ts", "!./vendor/**", "!node_modules/**", "!./src/views/node_modules/**", "!out/**"])
        .pipe(tslint())
        .pipe(tslint.report());
});

gulp.task("eslint", () => {
    return gulp.src(["**/*.ts", "**/*.tsx", "!**/*.d.ts", "!./vendor/**", "!node_modules/**", "!./src/views/node_modules/**", "!out/**"])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task("html-webpack", (done) => {
    const config = require("./src/views/webpack.config.js");
    config.context = `${__dirname}/src/views`;
    config.mode = argv.mode ? argv.mode : "production";
    return webpack(config, (err, stats) => {
        const statsJson = stats.toJson();
        if (err || (statsJson.errors && statsJson.errors.length)) {
            statsJson.errors.forEach(webpackError => {
                log.error(`Error (webpack): ${webpackError}`);
            });

            throw new PluginError("webpack", JSON.stringify(err || statsJson.errors));
        }
        log("[webpack]", stats.toString());
        done();
    });
});

gulp.task("node_modules-webpack", (done) => {
    const config = require("./webpack.config.js");
    config.context = `${__dirname}`;
    config.mode = argv.mode ? argv.mode : "production";
    return webpack(config, (err, stats) => {
        const statsJson = stats.toJson();
        if (err || (statsJson.errors && statsJson.errors.length)) {
            statsJson.errors.forEach(webpackError => {
                log.error(`Error (webpack): ${webpackError}`);
            });

            throw new PluginError("webpack", JSON.stringify(err || statsJson.errors));
        }
        log("[webpack]", stats.toString());
        done();
    });
});

gulp.task("insert-serial-monitor-cli", async (done) => {
    const platforms = [
        "linux",
        "darwin",
        "win32",
    ];
    const release = "latest";
    const destDir = path.resolve("out", "serial-monitor-cli");

    async function downloadAndUnzip(platform) {
        const fileName = `${platform}.zip`;
        const zipPath = path.join(destDir, fileName);
        await download(`https://github.com/microsoft/serial-monitor-cli/releases/${release}/download/${fileName}`,
                       destDir,
                       );
        await extract(zipPath, { dir: path.join(destDir, platform) });
        fs.rmSync(zipPath);
    }

    Promise.all(platforms.map(downloadAndUnzip)).then(done);
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
            },
        }))
        .pipe(gulp.dest("out"));
});

gulp.task("clean", (done) => {
    return del("out", done);
});

gulp.task("genAikey", (done) => {
    const packageJson = JSON.parse(fs.readFileSync("package.json"));
    packageJson.aiKey = "f1e4de2f-62b0-45e1-b36e-9216f21bd08e";
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2) + "\n");
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
    // the extension cannot be activated. As a workaround, remove extensionDependencies from package.json before
    // running test and restore extensionDependencies after test exited.
    removeExtensionDependencies();

    const child = childProcess.spawn("node", ["./out/test/runTest"], {
        cwd: __dirname,
        env: Object.assign({}, process.env),
    });

    child.stdout.on("data", (data) => {
        log(data.toString().trim());
    });

    child.stderr.on("data", (data) => {
        log.error(data.toString().trim());
    });

    child.on("error", (error) => {
        log.error(error);
    });

    child.on("exit", (code) => {
        restoreExtensionDependencies();
        if (code === 0) {
            done();
        } else {
            log.error("exit code: " + code);
            done(code);
        }
    });
});

gulp.task("build", gulp.series("clean", "ts-compile", "html-webpack", "node_modules-webpack", "insert-serial-monitor-cli"));

gulp.task("build_without_view", gulp.series("clean", "ts-compile"));

gulp.task("watch", () => {
    gulp.watch(["./src/**/*", "./test/**/*", "!./src/views/**/*"], ["ts-compile"]);
    gulp.watch(["./src/views/**/*", "!./src/views/node_modules/**"], ["html-webpack"]);
});
