/*global _, angular*/
var _times = Array(48).fill(0).map((el, i) => `${parseInt(i/2, 10)}:${i%2?3:0}0`).map(el => `${el.length < 5 ? 0 :''}${el}`);

angular.module('sc_core', ['sc_dnd', 'sc_request'])
  .constant('daysOfWeek', ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])
  .constant('times', _times)
  .constant('three_times', _times.concat(_times).concat(_times))
  .run(function($q, sc_core, sc_playlists, sc_ads, sc_schedule, sc_locations, sc_helpers, sc_playlist_previews, sc_playlist_tracks, sc_audio_ads_preview, sc_video_ads_preview) {
    $q.all([sc_playlists, sc_ads, sc_schedule, sc_locations, sc_audio_ads_preview, sc_video_ads_preview]).then(function(data) {
      sc_core.locations = data[3].data.result;
      sc_core.audio_ads_preview = data[4].data.result;
      sc_core.video_ads_preview = data[5].data.result;
      sc_core.playlists.splice(0, sc_core.playlists.length, ...data[0].data.result);
      sc_core.ads.splice(0, sc_core.ads.length, ...data[1].data);

      var Schedule = data[2].data.result.Schedule;
      var Settings = data[2].data.result.Settings;
      sc_core.Schedule = Schedule;
      sc_core.Settings = Settings;
      var pls_index = sc_core.playlists.reduce((res, el) => res.concat(el.playlists.slice(0).map(item => _.defaults(item, { plId: el.id, plTitle: el.name }))), []);
      var ads_index = sc_core.ads.reduce((res, el) => res.concat(el.Ads.slice(0).map(item => _.defaults(item, {catId: el.CategoryId, catName: el.Name, catType: el.Type}))), []);
      sc_core.workHours[0] = sc_helpers.trimTime(Schedule[0]['Open']);
      sc_core.workHours[1] = sc_helpers.trimTime(Schedule[0]['Close']);
      sc_core.minInterval = 2;
      sc_core.switchHours();

      Schedule.forEach( day => day.MusicIntervals.forEach( el => sc_core.addInterval(day.Day, sc_helpers.trimTime(el.Start), pls_index.find(pl => pl.id == el.Playlist)) ) );
      Schedule.forEach( day => day.AdIntervals.forEach( el => sc_core.addAdInterval(day.Day, sc_helpers.trimTime(el.Start), sc_helpers.trimTime(el.End),
        el.Ads.map(ad => _.defaults(ad, ads_index.find(aid => aid.Id == ad.Id))) )));
    });
  })
  .factory('sc_helpers', function() {
    return {
      trimTime: (time) => time.replace(/^1\./, '').slice(0,5)
    }
  })
  .factory('sc_save', function(sc_core, sc_upload) {
    return {
      process: () => {
        var result = {}
        result.Schedule = Array(7).fill()
          .map((day, n) => ({
            Day: n,
            Open: sc_core.workHours[0],
            Close: sc_core.workHours[1],
            MusicIntervals: sc_core.intervals.music[n].map((item) => ({
              Start: item.start,
              End: item.end,
              Playlist: item.id
            })),
            AdIntervals: sc_core.intervals.ads[n].map((item) => ({
              Start: item.start,
              End: item.end,
              Ads: item.content.map((ad) => _.pick(ad, ['StartDate', 'EndDate', 'Id'])),
              RepeatInterval: 15
            }))
          }))
        result.Settings = {
          Ads: {
            AudioRepeatIntervals: [10, 15, 20, 30, 45, 60],
            SlideshowInterval: 10
          }
        }
        sc_upload(result);
      }
    }
  })
  .factory('sc_core', function(daysOfWeek, times, three_times, sc_ads_preview, sc_playlist_previews, sc_playlist_tracks, sc_schedule) {
    var agenda = () => Array(7).fill().map(() => []);

    var actual = null;
    var locations = {};
    var mode      = { day: true, music: true };
    var workHours = [ times[20], times[40] ];
    var intervals = { music: agenda(), ads: agenda() };
    var timeGrid  = { music: agenda(), ads: agenda() };
    var timeRows  = times.concat(times).splice(16, 26);
    var ads = [];
    var playlists = [];
    var selectedInterval = [null, null];
    var playlist_previews = [];
    var Schedule = [];
    var Settings = [];
    var minInterval = 2;

    sc_schedule.then(function (data) {
      Schedule = data.data.result.Schedule;
      Settings = data.data.result.Settings;
    });

    var sliceTimes = (el) => timeRows.slice(timeRows.indexOf(el.start)).slice(0, el.for);

    var switchDisplay = () => {
      mode.day = !mode.day;
    }
    var switchContent = () => {

    }
    var switchHours = () => {
      var sometimes = times.concat(times).slice(times.indexOf(workHours[0]));
      timeRows.splice(0, 50, ...sometimes.slice(0, sometimes.slice(1).indexOf(workHours[1])+1));
      reshapeAll();
    }

    var addInterval = function(day, mark, data, addIntervalModal = null) {
      var overlaped = intervals.music[day].findIndex(el => el.start == mark);
      if (overlaped > -1)
      {
        if (overlaped > -1 && intervals.music[day][overlaped].for <= minInterval * 2)
        {
          if(angular.isDefined(addIntervalModal) && typeof addIntervalModal === 'function')
          {
            addIntervalModal();
          }
        }
        else{
          if (intervals.music[day][overlaped].for >= minInterval * 2)
          {
            var currStart = addHalfHoursIntervals(intervals.music[day][overlaped].start, minInterval);
            intervals.music[day][overlaped].start = currStart;
            intervals.music[day][overlaped].for -= minInterval;
          }
          else
          {
            intervals.music[day].splice(overlaped, 1);
          }
          
        }
      }

      intervals.music[day].unshift({ start: mark, for: 50, id: data.id, title: data.name });
      
      reshapeGrid(day);
    }

    var addAdInterval = function(day, start, end, data) {
      if(intervals.ads[day].length < 1)
      {
        start = workHours[0];
        end = workHours[1];
      }
      
      var _for = three_times.slice(three_times.indexOf(start)).indexOf(end);
      if (!~_for) _for = 5;

      var overlaped = intervals.ads[day].findIndex(el => el.start == start);
      /*if (overlaped > -1 && intervals.ads[day][overlaped].for < minInterval * 2)
      {
        addIntervalModal();
      }*/

      intervals.ads[day].unshift({ start: start, 'for': _for, content: data });
      reshapeAdGrid(day);
    }

    var toDate = function (dStr, hours = 0, minutes = 0) {
      var now = new Date();
         now.setHours(dStr.substr(0,dStr.indexOf(":")) + hours);
         now.setMinutes(dStr.substr(dStr.indexOf(":")+1) + minutes);
         now.setSeconds(0);
         return (now.getHours() < 10 ? "0" + now.getHours() : now.getHours()) + ":" + (now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes());
    }

    var addHalfHoursIntervals = function (dStr, _for = 0) {
      var now = new Date();
      var hours = Math.floor(_for/2);
      var minutes = _for % 2 > 0 ? 30 : 0;
      now.setHours(parseInt(dStr.substr(0,dStr.indexOf(":"))) + hours);
      now.setMinutes(parseInt(dStr.substr(dStr.indexOf(":")+1)) + minutes);
      now.setSeconds(0);
      return (now.getHours() < 10 ? "0" + now.getHours() : now.getHours()) + ":" + (now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes());
    }
    var getAdUrl = function(id) {
      sc_audio_ads_preview(id).then(data => {
        adUrl = data;
        return adUrl;
      })
    }
    var changeMusicInterval = function(info, [day, hour]) {
      if (info) {
        var ctx = mode.music ? 'music' : 'ads';
        var end = info.end;
        var _for = three_times.slice(three_times.indexOf(hour)).indexOf(end);
        var indexInfoTimeGrid = timeGrid[ctx][day].findIndex(el => el[1] != null && el[1].start === info.start);
        var prevIndex = timeGrid[ctx][day].findIndex(el => el[1] !== null && el[1].end === info.start);
        var indexInfoIntervals = intervals[ctx][day].findIndex(el => el.start === info.start);
        info.for = _for;
        info.start = hour;
        
        var indexForInsert = timeGrid[ctx][day].findIndex(el => el[0] === hour);
        //console.log(timeGrid[ctx][day]);
        if (prevIndex < indexInfoTimeGrid && mode.music) {
          var diffPrev = parseFloat(hour) - ((angular.isDefined(timeGrid[ctx][day][prevIndex]) && angular.isDefined(timeGrid[ctx][day][prevIndex][1])) ? parseFloat(timeGrid[ctx][day][prevIndex][1].start) : parseFloat(info.start));
          if (diffPrev >= 1) {
            var diff = parseFloat(info.end) - parseFloat(hour);
            if (diff => 1) {
              timeGrid[ctx][day][indexForInsert][1] = info;
              timeGrid[ctx][day][prevIndex][1].end = hour;
              timeGrid[ctx][day][indexInfoTimeGrid][1] = null;
              var _prevFor = three_times.slice(three_times.indexOf(timeGrid[ctx][day][prevIndex][1].start)).indexOf(hour);
              timeGrid[ctx][day][prevIndex][1].for = _prevFor;
              intervals[ctx][day][indexInfoIntervals] = info;
            }
          }
        } else if (!mode.music) {
          var diff = parseFloat(info.end) - parseFloat(hour);
          if (diff > 1) {
            if (timeGrid[ctx] !== null && timeGrid[ctx][day] !== null && timeGrid[ctx][day][prevIndex] !== undefined && timeGrid[ctx][day][prevIndex][1] !== null && timeGrid[ctx][day][prevIndex][1]) {
              var diffPrev = parseFloat(hour) - parseFloat(timeGrid[ctx][day][prevIndex][1].start);
              if (diffPrev >= 1) {
                timeGrid[ctx][day][prevIndex][1].end = hour;
                var _prevFor = three_times.slice(three_times.indexOf(timeGrid[ctx][day][prevIndex][1].start)).indexOf(hour);
                timeGrid[ctx][day][prevIndex][1].for = _prevFor;
              }
            }
            timeGrid[ctx][day][indexForInsert][1] = info;
            timeGrid[ctx][day][indexInfoTimeGrid][1] = null;
            intervals[ctx][day][indexInfoIntervals] = info;
          }

        }
      }
      reshapeGrid(day);
    }

    var resetInterval = function(hard) {
      var ctx = mode.music ? 'music' : 'ads';
      if (!actual) return;
      intervals[ctx].forEach((el, i) => el.splice(0, 50, ..._.cloneDeep(actual[i])));
      if (hard) actual = null;
      reshapeAll();
    }

    var temporalInterval = function(info, [day, mark], addIntervalModal = null) {
      var match;
      var ctx = mode.music ? 'music' : 'ads';
      if (!day) return resetInterval(true);
      if (!actual) actual = _.cloneDeep(intervals[ctx]);
      else resetInterval();
      intervals[ctx][day].splice(0, 50, ..._.cloneDeep(actual[day]));
      if (mode.music) return addInterval(day, mark, _.defaults({id: -1}, info), addIntervalModal);
      if ((match = intervals[ctx][day].find(el => sliceTimes(el).includes(mark)))) return selectedInterval.splice(0, 2, ...[day, match.start]);
      selectedInterval.splice(0, 2, ...[null, null]);
      addAdInterval(day, mark, -1, _.defaults({id: -1}, info));
    }

    var changeInterval = function(day, mark, start, end) {
      var ptr = intervals.music[day];
      var idx = ptr.findIndex(el => el.start == mark);
      if (start != mark) {
        ptr[idx].start = start;
      }
      if (end != ptr[idx].end) {
        ptr[idx+1].start = end;
      }
      reshapeGrid(day);
    }

    var changeAdInterval = function(day, mark, start, end) {
      var ptr = intervals.ads[day];
      var idx = ptr.findIndex(el => el.start == mark);
      if (start != mark) {
        ptr[idx].start = start;
      }
      var part = three_times.slice(three_times.indexOf(start));
      ptr[idx]['for'] = part.indexOf(end);

      if (!ptr[idx+1]) return reshapeAdGrid(day);
      var delta = ptr[idx]['for'] - part.indexOf(ptr[idx+1].start);
      if (delta > 0) {
        ptr[idx+1].start = end;
        ptr[idx+1]['for'] -= delta;
      }

      reshapeAdGrid(day);
    }

    var getBoundaryOptions = function(day, time) {
      var ptr = intervals.music[day];
      var idx = ptr.findIndex(el => el.start == time);
      if (!~idx) return null;
      var result = [null, null, ptr[idx]];
      if (ptr[idx-1]) {
        let start = timeRows.indexOf(ptr[idx-1].start) + 2;
        let end = timeRows.indexOf(ptr[idx].start) + ptr[idx]['for'] - 1;
        result[0] = timeRows.slice(start, end);
      }
      if (ptr[idx+1]) {
        let start = timeRows.indexOf(ptr[idx].start) + 2;
        let end = timeRows.indexOf(ptr[idx+1].start) + ptr[idx+1]['for'] - 1;
        result[1] = timeRows.slice(start, end);
      }
      return result;
    }

    var getAdBoundaryOptions = function(day, time) {
      var ptr = intervals.ads[day];
      var idx = ptr.findIndex(el => el.start == time);
      if (!~idx) return null;
      var result = [null, null, ptr[idx]];
      let start_earliest = ptr[idx-1] ? timeRows.indexOf(ptr[idx-1].start) + 2 : 0;
      let start_latest = timeRows.indexOf(ptr[idx].start) + ptr[idx]['for'] - 1;
      result[0] = timeRows.slice(start_earliest).slice(0, start_latest);
      let end_earliest_idx = timeRows.indexOf(ptr[idx].start);
      let end_earliest = timeRows[end_earliest_idx + 2];
      let end_length = ptr[idx+1] ? timeRows.indexOf(ptr[idx+1].start) + ptr[idx+1]['for'] - 2 : timeRows.length;
      result[1] = three_times.slice(three_times.indexOf(end_earliest)).slice(0, end_length - end_earliest_idx - 1);
      return result;
    }

    var removeInterval = function(day, mark) {
      var ctx = mode.music ? 'music' : 'ads';
      var index = intervals[ctx][day].findIndex(el => el.start == mark);
      if (!~index) return;
      intervals[ctx][day].splice(index, 1);
      if (mode.music) return reshapeGrid(day);
      reshapeAdGrid(day);
    }

    var reshapeGrid = function(day) {
      var ptr = intervals.music[day];
      if (ptr.length) {
        ptr.sort((a, b) => timeRows.indexOf(a.start) > timeRows.indexOf(b.start));
        ptr = ptr.filter((el, i, a) => (!i || timeRows.includes(el.start)) && a.findIndex(l => l.start == el.start) == i);
        ptr[0].start = timeRows[0];
        ptr.forEach((el, i, a) => el['for'] = (a[i+1] ? timeRows.indexOf(a[i+1].start) : timeRows.length) - timeRows.indexOf(el.start));
        ptr.forEach(el => el.end = three_times[three_times.indexOf(el.start) + el['for']]);
      }

      timeGrid.music[day] = timeRows.map((mark, idx, arr) => [
        mark,
        (intervals.music[day].find(el => el.start === mark) || null),
        !(intervals.music[day].find(el => sliceTimes(el).includes(mark)))
      ]);
    }

    var reshapeAdGrid = function(day) {
      var ptr = intervals.ads[day];
      if (ptr.length) {
        ptr.sort((a, b) => timeRows.indexOf(a.start) > timeRows.indexOf(b.start));
        ptr = ptr.filter((el, i, a) => (!i || timeRows.includes(el.start)) && a.findIndex(l => l.start == el.start) == i);
        if (!timeRows.includes(ptr[0].start)) ptr[0].start = timeRows[0];
        ptr.forEach((el, i, a) => {
          var next, delta;
          if (a[i+1] && ~(next = timeRows.indexOf(a[i+1].start)) && (delta = timeRows.indexOf(el.start) + el['for'] - next) > 0) {
            if (el['for'] - delta > 1) el['for'] -= delta;
            else {
              el['for'] = 2;
              a[i+1].start = timeRows[timeRows.indexOf(a[i+1].start)+1];
              a[i+1]['for'] -=1;
            }
          }
          if (!a[i+1]) el['for'] = Math.min(sliceTimes(el).length, el['for']);
        });
        ptr.forEach(el => el.end = three_times[three_times.indexOf(el.start) + el['for']]);
      }

      timeGrid.ads[day] = timeRows.map((mark, idx, arr) => [
        mark,
        (intervals.ads[day].find(el => el.start === mark) || null),
        !(intervals.ads[day].find(el => sliceTimes(el).includes(mark)))
      ]);
    }

    var reshapeAll = function() {
      daysOfWeek.forEach((day, i) => {
        reshapeGrid(i);
        reshapeAdGrid(i);
      });
    }

    reshapeAll();

    return {
      mode: mode,
      locations: locations,
      intervals: intervals,
      ads: ads,
      playlists: playlists,
      workHours: workHours,
      timeRows: timeRows,
      timeGrid: timeGrid,
      Schedule: Schedule,
      Settings: Settings,
      changeMusicInterval: changeMusicInterval,
      switchHours: switchHours,
      addInterval: addInterval,
      addAdInterval: addAdInterval,
      resetInterval: resetInterval,
      changeInterval: changeInterval,
      changeAdInterval: changeAdInterval,
      removeInterval: removeInterval,
      temporalInterval: temporalInterval,
      getBoundaryOptions: getBoundaryOptions,
      getAdBoundaryOptions: getAdBoundaryOptions,
      selectedInterval: selectedInterval,
      playlist_previews: playlist_previews,
      getAdUrl: function(id) {
        return sc_ads_preview.sc_ads_preview(id)
      },
      getPlaylistTracks: function(id) {
        return sc_playlist_tracks.sc_playlist_tracks(id);
      },
      getPlaylistPreview: function(id) {
        return sc_playlist_previews.sc_playlist_previews(id);
      }
    }
  })

  .directive('dimensionWatcher', function ($window) {

    return {
      link: link,
      restrict: 'E',
      template: '<style></style>'
    };

    function link(scope, element, attrs){
      scope.width = $window.innerWidth;
      angular.element($window).bind('resize', function(){
        scope.width = $window.innerWidth;
        scope.$digest();
      });
    }
  })

  .filter('interval', function(three_times) {
    return function(el) {
      return `${el.start} - ${three_times[three_times.indexOf(el.start) + el['for']]}`;
    }
  })

  .filter('hours', function() {
    return function(input, n) {
      if (input.slice(3) != '00') return '';
      var am = input.slice(0, 2)%12 || 12;
      am = (am > 9 ? '' : "\u00A0") + am + ' ' + (am == input.slice(0, 2) ? 'am' : 'pm' );
      if (input == '12:00') am = '12 pm';
      if (input == '00:00') am = '12 am';
      return am;
    }
  });
