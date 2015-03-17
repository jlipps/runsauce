"use strict";

var gulp = require("gulp");
var babel = require("gulp-babel");
var sourcemaps = require("gulp-sourcemaps");
var rename = require("gulp-rename");
var insert = require("gulp-insert-lines");
var clear = require('clear');
var Q = require('q');
var runSequence = Q.denodeify(require('run-sequence'));

var exitOnError = false;

gulp.task("transpile", function () {
  var mapPath = null;
  return gulp.src("src/**/*.js")
    .pipe(rename(function (path) {
      path.basename = path.basename.replace(".es6", "");
      mapPath = path.basename + ".map";
    }))
    .pipe(sourcemaps.init())
    .pipe(babel({experimental: true, optional: ["runtime"], sourceMap: "inline"}))
    .pipe(insert({
      after: /"use strict";/,
      lineAfter: "require('source-map-support').install();\n"
    }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"));
});

gulp.task('kill-gulp', function() {
  process.exit(0);
});

gulp.task('clear-terminal', function() {
  clear();
  return Q.delay(100);
});

// gulp error handling is not very well geared toward watch
// so we have to do that to be safe.
// that should not be needed in gulp 4.0
gulp.task('watch-build', function() {
  return runSequence('clear-terminal', ['transpile']);
});

gulp.task('watch', function () {
  exitOnError = true;
  gulp.watch(['src/**/*.js'], ['watch-build']);
  gulp.watch('gulpfile.js', ['clear-terminal','kill-gulp']);
});

gulp.task('spawn-watch', ['clear-terminal'], function() {
 var spawnWatch = function() {
    var proc = require('child_process').spawn('./node_modules/.bin/gulp', ['watch'], {stdio: 'inherit'});
    proc.on('close', function () {
      spawnWatch();
    });
  };
  spawnWatch();
});

// default target is watch
gulp.task('default', ['spawn-watch']);
