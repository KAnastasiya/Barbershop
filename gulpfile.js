'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const imageminPngquant = require('imagemin-pngquant');
const del = require('del');
const plugins = require('gulp-load-plugins')();
const gulpsync = require('gulp-sync')(gulp);
const webpack = require('webpack-stream');
const named = require('vinyl-named');

// Pug to Html
gulp.task('pug', () => {
  return gulp.src(['src/index.pug', 'src/shop.pug', 'src/product.pug', 'src/pricelist.pug'])
  .pipe(plugins.plumber({ errorHandler: plugins.notify.onError() }))
  .pipe(plugins.pug({pretty: true}))
  .pipe(gulp.dest('./'));
});

// Scss to Css
gulp.task('cleanCss', () => {
  return del('./css');
});

gulp.task('scss', ['cleanCss'], () => {
  return gulp.src('src/style.scss')
  .pipe(plugins.plumber({ errorHandler: plugins.notify.onError() }))
  .pipe(plugins.sourcemaps.init())
  .pipe(plugins.scss())
  .pipe(plugins.autoprefixer([
    'last 2 Chrome versions',
    'last 2 Firefox versions',
    'last 2 Opera versions',
    'last 2 Safari versions',
    'Explorer >= 10',
    'last 2 Edge versions',
    ],
    { cascade: false }
  ))
  .pipe(plugins.csscomb('./.csscomb.json'))
  .pipe(gulp.dest('./css'))
  .pipe(plugins.cssnano())
  .pipe(plugins.rename({suffix: '.min'}))
  .pipe(plugins.sourcemaps.write())
  .pipe(gulp.dest('./css'))
});

// ES2016 to common JS
// TODO: need stop this task after its finish
gulp.task('cleanScript', () => {
  return del('./js');
});

gulp.task('script', ['cleanScript'], () => {
  return gulp.src(['src/script.js'])
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'Webpack',
      message: err.message
    }))
  }))
  .pipe(named())
  .pipe(webpack(require('./webpack.config.js')))
  .pipe(gulp.dest('./js'));
});

gulp.task('scriptMin', () => {
  return gulp.src(['src/script.js'])
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'Webpack',
      message: err.message
    }))
  }))
  .pipe(named())
  .pipe(webpack(require('./webpack.config-uglify.js')))
  .pipe(plugins.rename({suffix: '.min'}))
  .pipe(gulp.dest('./js'));
});

// Html and Css linters
gulp.task('htmllint', () => {
  return gulp.src('./*.html')
  .pipe(plugins.htmlhint.reporter('htmlhint-stylish'))
  .pipe(plugins.htmlhint.failReporter({ suppress: true }))
});

gulp.task('csslint', () => {
  return gulp.src('./css/style.css')
  .pipe(plugins.csslint())
  .pipe(plugins.csslint.reporter())
});

// Creatio sprite
gulp.task('cleanIcon', () => {
  // return del('./icon');
});

gulp.task('pngSprite', ['cleanIcon'], () => {
  var spriteData = gulp.src(['src/blocks/*/icon/*', 'src/common/icon/*'])
    .pipe(plugins.spritesmith({
      imgName: 'sprite.png',
      cssName: '_sprite.scss',
      cssFormat: 'scss',
      algorithm: 'left-right',
      padding: 20,
      cssTemplate: 'src/common/scss/_sprite-template.scss'
    }));

  spriteData.img.pipe(gulp.dest('./icon'));
  spriteData.css.pipe(gulp.dest('src/common/scss'));
});

// Image optimizations
gulp.task('cleanImg', () => {
  return del('./img');
});

gulp.task('img', ['cleanImg'], () => {
  return gulp.src(['src/common/img/*.*', 'src/blocks/**/img/*.*'])
  .pipe(plugins.imagemin([
    plugins.imagemin.gifsicle({
      interlaced: true,
      optimizationLevel: 3
    }),
    imageminJpegRecompress({
      loops: 4,
      min: 50,
      max: 80,
      quality: 'high',
      strip: true,
      progressive: true
    }),
    imageminPngquant({quality: '50-80'}),
    plugins.imagemin.svgo({removeViewBox: true})
  ]))
  .pipe(gulp.dest('./img'));
});

// Server
gulp.task('browserSync', () => {
  browserSync({
    server: {
      baseDir: './',
      index: 'index.html'
    },
    notify: false
  });
});

// Watch mode
gulp.task('watch', gulpsync.sync(['scss', 'browserSync']), () => {
  // gulp.watch(['src/common/icon/*', 'src/blocks/*/icon/*'], ['pngSprite', 'scss', browserSync.reload]);
  // gulp.watch(['src/common/img/*', 'src/blocks/*/img/*'], ['img', browserSync.reload]);
  // gulp.watch(['src/*.pug', 'src/blocks/**/*.pug'], ['pug', browserSync.reload]);
  gulp.watch(['src/*.scss', 'src/common/scss/*.scss', 'src/blocks/*/*.scss'], ['scss', browserSync.reload]);
  // gulp.watch(['src/*.js', 'src/common/js/*.js', 'src/blocks/*/*.js'], ['script', browserSync.reload]);
});