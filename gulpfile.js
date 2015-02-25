"use strict";

var gulp = require("gulp");
var babel = require("gulp-babel");
var sourcemaps = require("gulp-sourcemaps");
var rename = require("gulp-rename");
var insert = require("gulp-insert-lines");

gulp.task("default", function () {
  var mapPath = null;
  return gulp.src("src/*.js")
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
