let gulp = require('gulp');
let msbuild = require("gulp-msbuild");
let nuget = require('gulp-nuget');
let del = require('del');
const argv = require('minimist')(process.argv.slice(2));

let pjson = require("./package.json");

function mj(path) {
    return "node_modules/mathjax" + path;
}

let files = [
    mj("/MathJax.js"),
    mj("/LICENSE"),
    mj("/config/*.js"),
    mj("/extensions/**/*.js"),
    mj("/fonts/**/*.{woff,txt}"),
    mj("/jax/**/*.js"),
    mj("/localization/**/*.js"),
];


let version = pjson.version;
let source = argv.src || "VisualOnStaging";

if (argv.build) {
    version += "-" + argv.build;
}

gulp.task('clean', function () {
    return del(['bin', "MathJax.WSP/Layouts/MathJax/**/*.*"]);
});

gulp.task('copy', ["clean"], function () {
    return gulp
        .src(files, { base: mj() })
        .pipe(gulp.dest("MathJax.WSP/Layouts/MathJax"));
});

gulp.task('build', ["copy"], function () {
    return gulp
        .src("MathJax.WSP/MathJax.WSP.csproj")
        .pipe(msbuild({
            errorOnFail: true,
            stdout: true,
            targets: ['Package'],
            toolsVersion: 15.0,
            configuration: "Release",
            verbosity: "minimal",
            properties: { BasePackagePath: "..\\bin\\" }
        }));
});

gulp.task('pack', ["build"], function () {
    return gulp
        .src("MathJax.nuspec")
        .pipe(nuget.pack({
            nuget: "nuget.exe",
            version: version,
            properties: 'configuration=Release;author=VisualOn GmbH;year=' + new Date().getUTCFullYear()
        }))
    .pipe(gulp.dest("bin/"));
});

gulp.task('push', [], function () {
    return gulp
        .src("bin/*.nupkg")
        .pipe(nuget.push({
            nuget: "nuget.exe",
            source: source
        }))
});

gulp.task('default', ["pack"]);
