$ = require
path = $ 'path'
gulp = $ 'gulp'
conf = $ './conf'

rename = $ 'gulp-rename'
gulpSequence = $('gulp-sequence')

release_path = 'output/release'
html_path = release_path + "/Views/Schedule"
js_path = release_path + "/Scripts/app/Scheduler"
css_path = "/Content/app/Scheduler"
css_path_root = release_path + "/Content/app/Scheduler"
fonts_path = release_path + "/fonts"

gulp.task 'build:dev:clean', ->
  $('del') [ release_path, '.tmp' ]

gulp.task 'build:dev', gulpSequence(
  'build:dev:clean',
  [ 'build:dev:fonts',  'build:dev:images' ],
  [ 'build:dev:js-vendor', 'build:dev:styles-vendor', 'build:dev:js-assets', 'build:dev:styles-assets' ]
  'build:dev:html',
  'build:dev:inject'
)

gulp.task 'build:dev:inject', ->
  gulp.src html_path + '/*.cshtml'
  .pipe    $('gulp-inject') (gulp.src js_path + '/vendor-*.js', read: false), starttag: '<!-- bower:js-->', endtag: '<!-- endbower-->', relative: false, ignorePath: release_path 
  .pipe    $('gulp-inject') (gulp.src css_path_root + '/vendor-*.css',read: false), starttag: '<!-- bower:css-->',endtag: '<!-- endbower-->', relative: false, ignorePath: release_path 
  .pipe    $('gulp-inject') (gulp.src js_path + '/scheduler-*.js', read: false), starttag: '<!-- assets:js-->', endtag: '<!-- endassetsjs-->', relative: false, ignorePath: release_path 
  .pipe    $('gulp-inject') (gulp.src css_path_root + '/scheduler-*.css', read: false), starttag: '<!-- assets:css-->',endtag: '<!-- endassetscss-->', relative: false, ignorePath: release_path 
  .pipe gulp.dest html_path

gulp.task 'build:dev:html', ->
  gulp.src [ '!src/demo/{mixin,layout}.jade', 'src/demo/**/*.jade' ]
  .pipe    $('gulp-consolidate') 'jade',
    basedir: 'src'
    doctype: 'html'
  .on 'error', conf.errorHandler 'Jade'
  .pipe (rename({
    name : 'Index'
    extname : '.cshtml'
  }))
  .pipe gulp.dest  html_path


gulp.task 'build:dev:js-vendor', ->
  gulp.src './bower.json'
  .pipe do $ 'gulp-main-bower-files'
  .pipe    $('gulp-filter') '**/*.js'
  .pipe    $('gulp-concat') 'vendor.js'
  #.pipe    $('gulp-uglify') preserveComments: 'license'
  .pipe do $ 'gulp-rev'
  .pipe gulp.dest js_path

gulp.task 'build:dev:js-assets', ->
  gulp.src ['./src/**/*.js', '!./src/**/*.debug.js']
  #.pipe    $('gulp-uglify') preserveComments: 'license'
  .pipe    $('gulp-concat') 'scheduler.js'
  .pipe do $ 'gulp-rev'
  .pipe gulp.dest js_path

gulp.task 'build:dev:styles-vendor', ->
  gulp.src './bower.json'
  .pipe do $ 'gulp-main-bower-files'
  .pipe    $('gulp-filter') '**/*.css'
  .pipe    $('gulp-replace') /\.\.\/font(s)?\/([^\.]+)\.(eot|svg|ttf|woff|woff2|otf)/g, 'fonts/$2.$3'
  .pipe do $ 'gulp-clean-css'
  .pipe    $('gulp-concat') 'vendor.css'
  .pipe do $ 'gulp-rev'
  .pipe gulp.dest css_path_root

gulp.task 'build:dev:styles-assets', ->
  gulp.src './src/**/*.css'
  .pipe    $('gulp-replace') /\/images\/([^\.]+)\.(png|jpg|jpeg)/g,  'images/$1.$2'
  .pipe    $('gulp-concat') 'scheduler.css'
  .pipe do $ 'gulp-rev'
  .pipe gulp.dest css_path_root

gulp.task 'build:dev:fonts', ->
  gulp.src './bower.json'
  .pipe do $ 'gulp-main-bower-files'
  .pipe    $('gulp-filter') '**/*.{eot,svg,ttf,woff,woff2,otf}'
  .pipe do $ 'gulp-flatten'
  .pipe gulp.dest fonts_path

gulp.task 'build:dev:images', ->
  gulp.src 'src/images/**/*'
  .pipe gulp.dest css_path_root + '/images'