/*global angular*/
angular.module('sc_request_env', [])
  .constant('sc_credentials', 'grant_type=password&username=DLevis&password=password')
  .constant('sc_store', 1810) // 1764, 1771, 1772, 1810, 1811, 3377
  .constant('sc_servername', 'https://api.dev.targetmediacentral.com')
  .factory('sc_auth', function($http, sc_credentials, sc_servername) {
    return $http({
      method: 'POST',
      url: `${sc_servername}/auth`,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      data: sc_credentials
    });
  })
  .factory('request_provider',function($q, $http, sc_auth) {
    return sc_auth.then( auth =>
        $q.when({
            headers : {'Authorization': `bearer ${auth.data.access_token}`}
        })
    );
  })