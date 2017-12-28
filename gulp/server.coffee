$ = require
path = $ 'path'
gulp = $ 'gulp'
conf = $ './conf'

browserSync = $ 'browser-sync'
browserSyncSpa = $ 'browser-sync-spa'

browserSyncInit = (baseDir, browser) ->
  browserSync.instance = browserSync.init(
    startPath: '/index.html'
    server:
      baseDir: baseDir
      routes:
        '/bower_components': 'bower_components'
        '/src': 'src'
    browser: conf.browser
    open: conf.openBrowser
    port: 3030
  )
  return

browserSync.use browserSyncSpa selector: '[ng-app]'

gulp.task 'serve', [ 'watch' ], ->
  browserSyncInit [ '.tmp', 'src' ]
