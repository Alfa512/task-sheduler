/*global angular*/
angular.module('sc_dnd', [])
  .directive('drag', function ($rootScope) {
    return {
      scope: true,
      link: function (scope, element, attrs) {
        element.attr('draggable', 'true');
        element.bind('dragstart', function (e) {
          $rootScope.drag_data = JSON.parse(attrs.dragInfo);
          if (!$rootScope.drag_data) $rootScope.drag_data = JSON.parse(attrs.dragInfo);

        });

      }
    }
  })

  .directive('drop', function ($rootScope) {
    return {
      restrict: 'A',
      scope: {onDrop: '&', onOver: '&'},
      link: function (scope, element, attrs) {
        var offsets = null;
        var last = '';
        var matchingElements = e => {
          var horizontal = offsets.horizontal.find(el => el[0] < e.clientX);
          var vertical = offsets.vertical.find(el => el[0] < e.clientY);
          if (!horizontal || !vertical) return [];
          return [horizontal[1], vertical[1]];
        };

        angular.element(document).on('dragstart', function (e) {
          if (!$rootScope.drag_data) return;
          offsets = {
            horizontal: [...element[0].querySelectorAll('[mark-h]')].map(el => [el.getBoundingClientRect().left, el.getAttribute('mark-h')]).reverse(),
            vertical:   [...element[0].querySelectorAll('[mark-v]')].map(el => [el.getBoundingClientRect().top, el.getAttribute('mark-v')]).reverse()
          };
        });

        angular.element(document).on('dragend', function (e) {
          $rootScope.isDrag = false;
          var calendar = angular.element(document.querySelector(".calendar"));
          if (calendar)
          {
            var top = 0, left = 0;
            var element = calendar[0];
            if(angular.isDefined(element) && typeof element.offsetTop !== 'undefined' )
            {
              top += element.offsetTop  || 0;
            }

            if(angular.isDefined(element) && angular.isDefined(element.offsetTop) && typeof element.offsetTop !== 'undefined' )
            {
              left += element.offsetLeft || 0;
            }

            while(angular.isDefined(element) && element.localName !== 'table') {
              element = element.parentElement;
              top += element.offsetTop  || 0;
              left += element.offsetLeft || 0;
            };
            var dragX = e.pageX, dragY = e.pageY;
            if(angular.isDefined(calendar[0]) && angular.isDefined(calendar[0].offsetHeight) /*&& dragY < calendar[0].offsetHeight + top*/ && dragX < left + calendar[0].offsetHeight)
            {
              var ti = $rootScope.drag_data;
              if(ti != null && angular.isDefined(ti))
              {
                $rootScope.datesDialog(ti, null);
              }
            }
          }
          if (scope.onOver && typeof scope.onOver == 'function') scope.onOver({ el: [] });
          $rootScope.drag_data = null;
          offsets = null;
          last = '';
        });

        element.on('dragover', function (e) {
          $rootScope.isDrag = true;
          if (!$rootScope.drag_data) return;
          if (e.preventDefault) e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();

          var els = matchingElements(e);
          if (last.toString() === els.toString()) return;

          if (scope.onOver && typeof scope.onOver == 'function')
            scope.onOver({ info: $rootScope.drag_data, el: els });
          last = els;
        });

        element.bind("drop", function (e) {
          if (!$rootScope.drag_data) return;
          if (e.preventDefault) e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();

          var els = matchingElements(e);
          if (els.toString() && scope.onDrop && typeof scope.onDrop == 'function')
            scope.onDrop({ info: $rootScope.drag_data, el: els });
        });
      }
    };
  })