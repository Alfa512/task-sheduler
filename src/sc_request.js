/*global angular*/
angular.module('sc_request', ['sc_request_env'])
  .factory('sc_playlists', function ($http, request_provider, sc_servername, sc_store) {
    return request_provider.then(template =>
      $http(angular.merge(template, {
        method: 'GET',
        url: `${sc_servername}/locations/${sc_store}/playlists`
      }))
    );
  })
  .factory('sc_ads', function ($http, request_provider, sc_servername, sc_store) {
    return request_provider.then(template =>
      $http(angular.merge(template, {
        method: 'GET',
        url: `${sc_servername}/locations/${sc_store}/ads`
      }))
    );
  })
  .factory('sc_schedule', function ($http, request_provider, sc_servername, sc_store) {
    return request_provider.then(template =>
      $http(angular.merge(template, {
        method: 'GET',
        url: `${sc_servername}/locations/${sc_store}/schedule`
      }))
    );
  })
  .factory('sc_locations', function ($http, request_provider, sc_servername) {
    return request_provider.then(template =>
      $http(angular.merge(template, {
        method: 'GET',
        url: `${sc_servername}/locations`
      }))
    );
  })
  .factory('sc_playlist_previews', function ($http, request_provider, sc_servername) {
    return {
      sc_playlist_previews: function (id) {
        return request_provider.then(template =>
          $http(angular.merge(template, {
            method: 'GET',
            url: `${sc_servername}/playlists/${id}/preview`
          })))
      }
    }
  })
  .factory('sc_playlist_tracks', function ($http, request_provider, sc_servername) {
    return {
      sc_playlist_tracks: function (id) {
        return request_provider.then(template =>
          $http(angular.merge(template, {
            method: 'GET',
            url: `${sc_servername}/playlists/${id}/tracks`
          })))
      }
    }
  })
  .factory('sc_video_ads_preview', function ($http, request_provider, sc_servername) {
    return request_provider.then(template =>
      $http(angular.merge(template, {
        method: 'GET',
        url: `${sc_servername}/ads/546/preview` //TODO Remove???
      }))
    );
  })
  .factory('sc_audio_ads_preview', function ($http, request_provider, sc_servername) {
    return request_provider.then(template =>
      $http(angular.merge(template, {
        method: 'GET',
        url: `${sc_servername}/ads/623/preview` //TODO Remove???
      }))
    );
  })
  .factory('sc_ads_preview', function ($http, request_provider, sc_servername) {
    return {
      sc_ads_preview: function (id) {
        return request_provider.then(template =>
          $http(angular.merge(template, {
            method: 'GET',
            url: `${sc_servername}/ads/${id}/preview`
          })))
      }
    }
  })
  .factory('sc_upload', function ($http, request_provider, sc_servername, sc_store) {
    return (data) => request_provider.then(template =>
      $http(angular.merge(template, {
        method: 'POST',
        data: data,
        url: `${sc_servername}/locations/${sc_store}/schedule`
      }))
    )
  });