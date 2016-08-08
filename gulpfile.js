let gulp = require('gulp');
let msbuild = require("gulp-msbuild");
let nuget = require('gulp-nuget');
let gutil = require('gulp-util');
let del = require('del');

let pjson = require("./package.json");

function mj(path) {
    return "node_modules/mathjax" + path;
}

let files = [
    mj("/MathJax.js"),
    mj("/LICENSE"),
    mj("/extensions/**/*.js"),
    mj("/fonts/**/*.{woff,txt}"),
    mj("/jax/**/*.js"),
    mj("/localization/**/*.js"),
];


let version = pjson.version;

if (gutil.env.build) {
    version += "-" + gutil.env.build;
}

function clean() {
    // You can use multiple globbing patterns as you would with `gulp.src`
    return del(['bin', "MathJax.WSP/Layouts/MathJax/**/*.*"]);
}

gulp.task('clean', clean);

gulp.task('copy', ["clean"], function () {
    return gulp
        .src(files, { base: mj() })
        .pipe(gulp.dest("MathJax.WSP/Layouts/MathJax"))
});

gulp.task('build', ["copy"], function () {
    return gulp
        .src("MathJax.WSP/MathJax.WSP.csproj")
        .pipe(msbuild({
            errorOnFail: true,
            stdout: true,
            targets: ['Package'],
            toolsVersion: 14.0,
            configuration: "Release",
            verbosity: "minimal",
            properties: { BasePackagePath: "..\\bin\\" }
        }))
});

gulp.task('pack', ["build"], function () {
    return gulp
        .src("MathJax.nuspec")
        .pipe(nuget.pack({
            nuget: "nuget.exe",
            version: version,
            properties: 'configuration=Release;author=VisualOn GmbH;year=' + new Date().getUTCFullYear()
        }))
    .pipe(gulp.dest("bin/"))
});

gulp.task('default', ["pack"]);
