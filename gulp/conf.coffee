gutil = require('gulp-util')

# exports.browser = 'chromium-browser'
exports.browser = 'qupzilla'
exports.openBrowser = false

exports.paths =
  src: 'src'
  dist: 'dist'
  demo: 'demo'
  tmp: '.tmp'
  e2e: 'e2e'

exports.bSync = require 'browser-sync'
exports.lodash = require 'lodash'
exports.plugins = (require 'gulp-load-plugins')()
exports.plugins.del = require 'del'
exports.wiredep = (require 'wiredep').stream

exports.errorHandler = (title) ->
  'use strict'
  (err) ->
    gutil.log gutil.colors.red('[' + title + ']'), err.toString()
    @emit 'end'
    return
