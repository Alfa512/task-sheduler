$ = require
path = $ 'path'
gulp = $ 'gulp'
conf = $ './conf'

gulp.task 'pages', [ 'bower', 'assets' ], ->
  gulp.src [ '!src/demo/{mixin,layout}.jade', 'src/demo/**/*.jade' ]
  .pipe $('gulp-consolidate') 'jade', basedir: 'src', doctype: 'html', pretty: '  '
  .on 'error', conf.errorHandler 'Jade'
  .pipe    $('gulp-rename') (path) -> path.extname = '.html'
  .pipe gulp.dest '.tmp'
  .pipe conf.bSync.stream()

gulp.task 'bower', ->
  gulp.src 'src/demo/layout.jade'
  .pipe $('wiredep').stream $('lodash').extend {}, directory: 'bower_components'
  .pipe gulp.dest 'src/demo'

gulp.task 'assets', ->
  gulp.src 'src/demo/layout.jade'
  .pipe    $('gulp-inject') (gulp.src ['src/*.js' , '!src/*.dev.js'], read: false), starttag: '// assets:js', endtag: '// endassetsjs'
  .pipe    $('gulp-inject') (gulp.src 'src/*.css',read: false), starttag: '// assets:css',endtag: '// endassetscss'
  .pipe gulp.dest 'src/demo'

gulp.task 'clean', ->
  $('del') [ 'demo', '.tmp' ]
