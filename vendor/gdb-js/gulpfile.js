const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const gutil = require( 'gulp-util');
const through = require('through2');
const babel = require('gulp-babel');
const stripBom = require('strip-bom-buffer');
const changed = require('gulp-changed');
const sourcemaps = require('gulp-sourcemaps');
const babelOpts = require("babel-core/lib/transformation/file/options/build-config-chain")({ filename: __filename })[0].options;
const plumber = require('gulp-plumber');
const  readThrough = function() {
    return through.obj(function (file, enc, cb) {
        gutil.log('compiling', gutil.colors.blue(path.basename(file.path)));
        file.contents = stripBom(fs.readFileSync(file.path));
        this.push(file);
        cb();
    });
};

gulp.task('babel', () => {
    return gulp.src(['src/**/*.js', 'test/**/*.js'], {cwd:'.', read:false})
        .pipe(plumber())
        .pipe(changed('out'))
        .pipe(readThrough())
        .pipe(sourcemaps.init())
        .pipe(babel(babelOpts))
        .pipe(sourcemaps.write('.', { sourceRoot: '../src' }))
        .pipe(gulp.dest('out'));
});

gulp.task('default', ['babel']);