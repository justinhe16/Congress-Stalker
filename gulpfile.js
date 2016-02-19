/**
 * Javascript Task Runner
 * @author Justin He (justinhe16@gmail.com)
 */

var gulp = require("gulp");
var autoprefixer = require("gulp-autoprefixer");
var concat = require("gulp-concat");
var cssnano = require("gulp-cssnano");
var less = require("gulp-less");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify");

gulp.task("default", ["js", "less"]);

gulp.task("js", function() {
  return gulp.src(["./shared/*.js",
                   "./static/js/game/*.js",
                   "./static/js/*.js"])
    .pipe(concat("minified.js"))
    .pipe(uglify())
    .pipe(gulp.dest("static/dist"));
});

gulp.task("less", function() {
  return gulp.src("./static/less/styles.less")
    .pipe(less({ compress: true}))
    .pipe(autoprefixer())
    .pipe(cssnano())
    .pipe(rename(function(path) {
      path.basename = "minified";
      path.extname = ".css";
    }))
    .pipe(gulp.dest("./static/dist"));
});

gulp.task("watch-js", function() {
 gulp.watch(["./shared/*.js",
             "./static/js/*.js",
             "./static/js/game/*.js"], ["js"]);
});

gulp.task("watch-less", function() {
  gulp.watch("./static/less/*.less", ["less"]);
});

gulp.task("watch", function() {
 gulp.watch(["./static/js/*.js"], ["js"]);
  gulp.watch("./static/less/*.less", ["less"]);
});