import gulp from 'gulp';
import msbuild from 'gulp-msbuild';
import nuget from 'gulp-nuget';
import del from 'del';
import minimist from 'minimist';
import pkg from './package.json' assert { type: 'json' };

const argv = minimist(process.argv.slice(2));

function mj(path) {
  return 'node_modules/mathjax' + path;
}

let files = [
  mj('/MathJax.js'),
  mj('/LICENSE'),
  mj('/config/*.js'),
  mj('/extensions/**/*.js'),
  mj('/fonts/**/*.{woff,txt}'),
  mj('/jax/**/*.js'),
  mj('/localization/**/*.js'),
];

let version = pkg.version;
let source = argv.src || 'VisualOnStaging';

if (argv.build) {
  version += '-' + argv.build;
}

export function clean() {
  return del(['bin', 'MathJax.WSP/Layouts/MathJax/**/*.*']);
}

export function copy() {
  return gulp.src(files, { base: mj() }).pipe(gulp.dest('MathJax.WSP/Layouts/MathJax'));
}

export function compile() {
  return gulp.src('MathJax.WSP/MathJax.WSP.csproj').pipe(
    msbuild({
      errorOnFail: true,
      stdout: true,
      targets: ['Package'],
      toolsVersion: 'auto',
      configuration: 'Release',
      verbosity: 'minimal',
      properties: { BasePackagePath: '..\\bin\\' },
    })
  );
}

export function pack() {
  return gulp.src('MathJax.nuspec')
    .pipe(
      nuget.pack({
        nuget: 'nuget.exe',
        version: version,
        properties:
          'configuration=Release;author=VisualOn GmbH;year=' +
          new Date().getUTCFullYear(),
      })
    )
    .pipe(gulp.dest('bin/'));
}

export function push() {
  return gulp.src('bin/*.nupkg').pipe(
    nuget.push({
      nuget: 'nuget.exe',
      source: source,
    })
  );
}

export const build = gulp.series(clean, copy, compile, pack);

export default build;
