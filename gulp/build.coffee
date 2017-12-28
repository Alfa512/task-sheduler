$ = require
path = $ 'path'
gulp = $ 'gulp'
conf = $ './conf'

gulp.task 'build', [ 'inject' ]

gulp.task 'prepare', [ 'scripts', 'styles' ]

gulp.task 'compile', ->
  gulp.src [ '!src/demo/{mixin,layout}.jade', 'src/demo/**/*.jade' ]
  .pipe    $('gulp-consolidate') 'jade',
    basedir: 'src'
    doctype: 'html'
  .on 'error', conf.errorHandler 'Jade'
  .pipe    $('gulp-rename') (path) -> path.extname = '.html'
  .pipe gulp.dest 'demo'
  # .pipe conf.bSync.stream()

gulp.task 'inject', [ 'images', 'compile', 'prepare' ], ->
  gulp.src 'demo/**/*.html'
  .pipe    $('gulp-inject') (gulp.src 'demo/*.js', read: false), starttag: '<!-- bower:js-->', endtag: '<!-- endbower-->', relative: true
  .pipe    $('gulp-inject') (gulp.src 'demo/*.css',read: false), starttag: '<!-- bower:css-->',endtag: '<!-- endbower-->', relative: true
  .pipe    $('gulp-inject') (gulp.src '', read: false), starttag: '<!-- assets:js-->', endtag: '<!-- endassetsjs-->', relative: true
  .pipe    $('gulp-inject') (gulp.src '', read: false), starttag: '<!-- assets:css-->',endtag: '<!-- endassetscss-->', relative: true
  .pipe gulp.dest 'demo'

gulp.task 'scripts', [ 'js-assets' ], ->
  gulp.src './bower.json'
  .pipe do $ 'gulp-main-bower-files'
  .pipe    $('gulp-filter') '**/*.js'
  #.pipe    $('gulp-uglify') preserveComments: 'license'
  .pipe    $('gulp-concat') 'vendor.js'
  .pipe do $ 'gulp-rev'
  .pipe gulp.dest 'demo'

gulp.task 'js-assets', ->
  gulp.src './src/**/*.js'
  #.pipe    $('gulp-uglify') preserveComments: 'license'
  .pipe    $('gulp-concat') 'z-assets.js'
  .pipe do $ 'gulp-rev'
  .pipe gulp.dest 'demo'

gulp.task 'styles', [ 'fonts' ], ->
  gulp.src './bower.json'
  .pipe do $ 'gulp-main-bower-files'
  .pipe    $('gulp-filter') '**/*.css'
  .pipe    $('gulp-replace') /\.\.\/font\/[^\/]+\/([^\.]+)\.(eot|svg|ttf|woff|woff2)/g, '../fonts/$1.$2'
  .pipe do $ 'gulp-clean-css'
  .pipe    $('gulp-concat') 'vendor.css'
  .pipe do $ 'gulp-rev'
  .pipe gulp.dest 'demo'

gulp.task 'fonts', ->
  gulp.src './bower.json'
  .pipe do $ 'gulp-main-bower-files'
  .pipe    $('gulp-filter') '**/*.{eot,svg,ttf,woff,woff2}'
  .pipe do $ 'gulp-flatten'
  .pipe gulp.dest 'demo/fonts'

gulp.task 'images', ->
  gulp.src 'src/images/**/*'
  .pipe gulp.dest 'demo/images'

# debug
#gulp.task 'csss', ->
#  gulp.src './bower.json'
#  .pipe do $ 'gulp-main-bower-files'
#  .pipe    $('gulp-filter') '**/*.css'
#  .pipe do $('gulp-filenames-to-json')
#  .pipe gulp.dest 'demo'
