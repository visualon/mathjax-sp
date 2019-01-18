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

function clean() {
    return del(['bin', "MathJax.WSP/Layouts/MathJax/**/*.*"]);
}

function copy() {
    return gulp
        .src(files, { base: mj() })
        .pipe(gulp.dest("MathJax.WSP/Layouts/MathJax"));
}

function compile() {
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
}

function pack() {
    return gulp
        .src("MathJax.nuspec")
        .pipe(nuget.pack({
            nuget: "nuget.exe",
            version: version,
            properties: 'configuration=Release;author=VisualOn GmbH;year=' + new Date().getUTCFullYear()
        }))
    .pipe(gulp.dest("bin/"));
}

function push() {
    return gulp
        .src("bin/*.nupkg")
        .pipe(nuget.push({
            nuget: "nuget.exe",
            source: source
        }))
}

const build = gulp.series(clean, copy, compile, pack)

exports.clean = clean;
exports.copy = copy;
exports.compile = compile;
exports.pack = pack;
exports.push = push;
exports.build = build;


exports.default = build;
