/*global angular*/
angular.module('sc_request_env', [])
  .constant('sc_servername', 'https://api.dev.targetmediacentral.com')
  .factory('sc_store', function($location){
    var url = new URL($location.absUrl());
    var match = /\/Schedule\/Location\/(\d+)/.exec(url.pathname)
    return +match[1];
  })
  .factory('request_provider',function($q, $http) {
    return $q.when({});
  })