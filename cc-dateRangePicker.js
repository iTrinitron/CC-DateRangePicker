/* 
 * datePicker Directive
 * @library https://github.com/g00fy-/angular-datepicker
 * 
 * date: 6/22/2015
 * @modified Michael Chin
 */

/*
 * For the modified version of dateRange, only the 'date' view is used.  All 
 * other views are untested, and may not functinoal correctly.
 * i.e. scope.view = 'date' ALWAYS
 * 
 * scope.model represents the start/end date visible on the datePicker.  Never 
 * allow it to change itself.  Always modify scope.model through it's binding
 * on model: '=datePicker'
 * 
 */

'use strict';

var Module = angular.module('datePicker', []);

Module.constant('datePickerConfig', {
  template: 'templates/datepicker.html',
  view: 'month',
  views: ['year', 'month', 'date', 'hours', 'minutes'],
  step: 5
});

Module.filter('time',function () {
  function format(date){
    return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
  }

  return function (date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
      if (isNaN(date.getTime())) {
        return undefined;
      }
    }
    return format(date);
  };
});

Module.directive('datePicker', ['datePickerConfig', 'datePickerUtils', function datePickerDirective(datePickerConfig, datePickerUtils) {

  //noinspection JSUnusedLocalSymbols
  return {
    require: ['?ngModel', '^datePickerApp'],
    template: '<div ng-include="template"></div>',
    scope: {
      model: '=datePicker',
      after: '=?',
      before: '=?',
      pid: '='
    },
    controller: ["$scope", function($scope) {
        
    }],
    link: function (scope, element, attrs, cntrl) {
        var ngModel = cntrl[0];
        var datePickerApp = cntrl[1];
        
       /*
        * Listener
        * 
        * Changes the months whenever the next/prev button is clicked on the
        * dateRange directive
        * 
        * @author Michael C
        */
      scope.$on("next", function() {
         scope.next();
      });
      scope.$on("prev", function() {
         scope.prev();
      });  
      
      /*
       * Listener
       * 
       * Updates the view anytime the calendar is re-opened
       * 
       * @author Michael C
       */
      scope.$on("updateView", function() {
        scope.date = new Date(datePickerApp.getViewDate(scope.pid));
      });
      
      var arrowClick = false;

      //Set the VIEW date of the datePicker
      scope.date = new Date(datePickerApp.getViewDate(scope.pid));
      
      scope.views = datePickerConfig.views.concat();
      scope.view = attrs.view || datePickerConfig.view;
      scope.now = new Date();
      scope.template = attrs.template || datePickerConfig.template;
      var step = parseInt(attrs.step || datePickerConfig.step, 10);
      var partial = !!attrs.partial;

      //if ngModel, we can add min and max validators
      /*
      if(ngModel)
      {
        if (angular.isDefined(attrs.minDate)) {
          //console.log("Min defined");
          var minVal;
          ngModel.$validators.min = function (value) {
            return !datePickerUtils.isValidDate(value) || angular.isUndefined(minVal) || value >= minVal;
          };
          attrs.$observe('minDate', function (val) {
            minVal = new Date(val);
            ngModel.$validate();
          });
        } 

        if (angular.isDefined(attrs.maxDate)) {
          var maxVal;
          ngModel.$validators.max = function (value) {
            return !datePickerUtils.isValidDate(value) || angular.isUndefined(maxVal) || value <= maxVal;
          };
          attrs.$observe('maxDate', function (val) {
            maxVal = new Date(val);
            ngModel.$validate();
          });
        }
      } */
      //end min, max date validator

      /** @namespace attrs.minView, attrs.maxView */
      scope.views =scope.views.slice(
        scope.views.indexOf(attrs.maxView || 'year'),
        scope.views.indexOf(attrs.minView || 'minutes')+1
      );

      if (scope.views.length === 1 || scope.views.indexOf(scope.view)===-1) {
        scope.view = scope.views[0];
      }

      scope.setView = function (nextView) {
        if (scope.views.indexOf(nextView) !== -1) {
          scope.view = nextView;
        }
      };

      scope.setDate = function (date, month) {
        //Do nothing if the date is disabled
        if(attrs.disabled || scope.isDisabled(date, month)) {
          return;
        }
        scope.date = date;
        // change next view
        var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
        
        //If we are selecting a date.. we need to update more
        if ((!nextView || partial) || scope.model) {

          //scope.model = new Date(date);
          //if ngModel , setViewValue and trigger ng-change, etc...
          
          if(ngModel) {
            ngModel.$setViewValue(scope.date);
          } 

          var view = partial ? 'minutes' : scope.view;
          //noinspection FallThroughInSwitchStatementJS
          switch (view) {
          case 'minutes':
            scope.model.setMinutes(date.getMinutes());
          /*falls through*/
          case 'hours':
            scope.model.setHours(date.getHours());
          /*falls through*/
          
          //This is the default case set by dateRange --
          case 'date':
            //Let the dateRange know that it has been changed
            scope.$emit('dateChange', new Date(date));
            update(); //This is an expensive call 
            
            break;
          /*falls through*/
          case 'month':
            scope.model.setMonth(date.getMonth());
          /*falls through*/
          case 'year':
            scope.model.setFullYear(date.getFullYear());
          }
          scope.$emit('setDate', scope.model, scope.view);
        }

        if (nextView) {
          scope.setView(nextView);
        }

        if(!nextView && attrs.autoClose === 'true'){
          element.addClass('hidden');
          scope.$emit('hidePicker');
        }
      };
      
      /*
       * @author Michael
       */
      scope.$on('hidePickers', function() {
          element.addClass('hidden');
          scope.$emit('hidePicker');
      });

      function update() {
        var view = scope.view;

        /*
         * this had to be commented out because it caused weird month bugs
        if (scope.model && !arrowClick) {
          scope.date = new Date(scope.model);
          arrowClick = false;
        } */
        var date = scope.date;

        switch (view) {
        case 'year':
          scope.years = datePickerUtils.getVisibleYears(date);
          break;
        case 'month':
          scope.months = datePickerUtils.getVisibleMonths(date);
          break;
        case 'date':
          scope.weekdays = scope.weekdays || datePickerUtils.getDaysOfWeek();
          scope.weeks = datePickerUtils.getVisibleWeeks(date); //this is where it sets the date..
          break;
        case 'hours':
          scope.hours = datePickerUtils.getVisibleHours(date);
          break;
        case 'minutes':
          scope.minutes = datePickerUtils.getVisibleMinutes(date, step);
          break;
        }
      }

      function watch() {
        if (scope.view !== 'date') {
          return scope.view;
        }
        return scope.date ? scope.date.getMonth() : null;
      }


      scope.$watch(watch, update);

      scope.next = function (delta) {
        var date = scope.date;
        delta = delta || 1;
        switch (scope.view) {
        case 'year':
        /*falls through*/
        case 'month':
          date.setFullYear(date.getFullYear() + delta);
          break;
        case 'date':
          /* Reverting from ISSUE #113
          var dt = new Date(date);
          date.setMonth(date.getMonth() + delta);
          if (date.getDate() < dt.getDate()) {
            date.setDate(0);
          }
          */
          date.setMonth(date.getMonth() + delta);
          break;
        case 'hours':
        /*falls through*/
        case 'minutes':
          date.setHours(date.getHours() + delta);
          break;
        }
        arrowClick = true;
        update();
      };

      scope.prev = function (delta) {
        return scope.next(-delta || -1);
      };

      scope.isAfter = function (date) {
        return scope.after && datePickerUtils.isAfter(date, scope.after);
      };

      scope.isBefore = function (date) {
        return scope.before && datePickerUtils.isBefore(date, scope.before);
      };

      scope.isSameMonth = function (date) {
        return datePickerUtils.isSameMonth(scope.model, date);
      };

      scope.isSameYear = function (date) {
        return datePickerUtils.isSameYear(scope.model, date);
      };
      
      scope.dateIsSameYear = function(date) {
          return datePickerUtils.isSameYear(date, new Date());
      };

      scope.isSameDay = function (date) {
        return (scope.isStartDay(date) || scope.isEndDay(date));
      };
      
      scope.isStartDay = function(date) {
          return datePickerUtils.isSameDay(datePickerApp.getSelectedStartDate(), date);
      };
      
      scope.isEndDay = function(date) {
          return datePickerUtils.isSameDay(datePickerApp.getSelectedEndDate(), date);
      };

      scope.isSameHour = function (date) {
        return datePickerUtils.isSameHour(scope.model, date);
      };

      scope.isSameMinutes = function (date) {
        return datePickerUtils.isSameMinutes(scope.model, date);
      };
      
    /*
     * isDisabled
     * 
     * Checks to see if a given day is within the valid dates
     * -the day is on or after today's date
     * -the day is within the given month it appears in
     * 
     * @param javascript Date object day
     * @param javascript Date object date
     * @return boolean
     * 
     * @author Michael C
     */
    scope.isDisabled = function(day, date) {
        //If we are choosing a start date...
        if(datePickerApp.getStartCal()) {
            //Limit by min/max
            var minDate = datePickerApp.minStartDate;
            var maxDate = datePickerApp.maxStartDate;
        }
        else {
            //Limit by min/max end
            var minDate = datePickerApp.minEndDate;
            var maxDate = datePickerApp.maxEndDate;
            //If the day is past the max end date offset
            if(datePickerApp.maxEndDateOffset != null) {
                if(datePickerApp.getMaxEndDate() != null) {
                    if(day > datePickerApp.getMaxEndDate()) {
                        return true;
                    }
                }
            }
        }
        
        //If the day is past the max-start-date
        if(day > maxDate) {
          return true;
        }
        //If the day is before the min-start-date
        else if(day < minDate) {
          return true;
        }
        

        if((day.getMonth() != date.getMonth())) {
          return true;
        }

        return false;
    };

      scope.isNow = function (date) {
        var is = true;
        var now = scope.now;
        //noinspection FallThroughInSwitchStatementJS
        switch (scope.view) {
        case 'minutes':
          is &= ~~(date.getMinutes()/step) === ~~(now.getMinutes()/step);
        /*falls through*/
        case 'hours':
          is &= date.getHours() === now.getHours();
        /*falls through*/
        case 'date':
          is &= date.getDate() === now.getDate();
        /*falls through*/
        case 'month':
          is &= date.getMonth() === now.getMonth();
        /*falls through*/
        case 'year':
          is &= date.getFullYear() === now.getFullYear();
        }
        return is;
      };
    }
  };
}]);
angular.module('datePicker').factory('datePickerUtils', function(){
  var createNewDate = function(year, month, day, hour, minute) {
    // without any arguments, the default date will be 1899-12-31T00:00:00.000Z
    return new Date(year | 0, month | 0, day | 0, hour | 0, minute | 0);
  };
  return {
    getVisibleMinutes : function(date, step) {
      date = new Date(date || new Date());
      var year = date.getFullYear();
      var month = date.getMonth();
      var day = date.getDate();
      var hour = date.getUTCHours();
      var minutes = [];
      var minute, pushedDate;
      for (minute = 0 ; minute < 60 ; minute += step) {
        pushedDate = createNewDate(year, month, day, hour, minute);
        minutes.push(pushedDate);
      }
      return minutes;
    },
    getVisibleWeeks : function(date) {
      date = new Date(date || new Date());
      var startMonth = date.getMonth();
      var startYear = date.getYear();
      // set date to start of the week
      date.setDate(1);

      if (date.getDay() === 0) {
        // day is sunday, let's get back to the previous week
        date.setDate(-5);
      } else {
        // day is not sunday, let's get back to the start of the week
        date.setDate(date.getDate() - (date.getDay() - 1));
      }
      if (date.getDate() === 1) {
        // day is monday, let's get back to the previous week
        date.setDate(-6);
      }

      var weeks = [];
      var week;
      while (weeks.length < 6) {
        /* commented out -- makes it so that all months have 6 weeks.  All the time
            if (date.getYear() === startYear && date.getMonth() > startMonth) {
          break;
        } */
        week = this.getDaysOfWeek(date);
        weeks.push(week);
        date.setDate(date.getDate() + 7);
      }
      return weeks;
    },
    getVisibleYears : function(date) {
      date = new Date(date || new Date());
      date.setFullYear(date.getFullYear() - (date.getFullYear() % 10));
      var year = date.getFullYear();
      var years = [];
      var pushedDate;
      for (var i = 0; i < 12; i++) {
        pushedDate = createNewDate(year);
        years.push(pushedDate);
        year++;
      }
      return years;
    },
    getDaysOfWeek : function(date) {
      date = new Date(date || new Date());
      date.setDate(date.getDate() - (date.getDay())); //was (date.getDay() - 1) changed to no -1 to start on Sunday instead of monday
      var year = date.getFullYear();
      var month = date.getMonth();
      var day = date.getDate();
      var days = [];
      var pushedDate;
      for (var i = 0; i < 7; i++) {
        pushedDate = createNewDate(year, month, day);
        days.push(pushedDate);
        day++;
      }
      return days;
    },
    getVisibleMonths : function(date) {
      date = new Date(date || new Date());
      var year = date.getFullYear();
      var months = [];
      var pushedDate;
      for (var month = 0; month < 12; month++) {
        pushedDate = createNewDate(year, month, 1);
        months.push(pushedDate);
      }
      return months;
    },
    getVisibleHours : function(date) {
      date = new Date(date || new Date());
      var year = date.getFullYear();
      var month = date.getMonth();
      var day = date.getDate();
      var hours = [];
      var hour, pushedDate;
      for (hour = 0 ; hour < 24 ; hour++) {
        pushedDate = createNewDate(year, month, day, hour);
        hours.push(pushedDate);
      }
      return hours;
    },
    isAfter : function(model, date) {
      model = (model !== undefined) ? new Date(model) : model;
      date = new Date(date);
      return model && model.getTime() >= date.getTime();
    },
    isBefore : function(model, date) {
      model = (model !== undefined) ? new Date(model) : model;
      date = new Date(date);
      return model.getTime() <= date.getTime();
    },
    isSameYear :   function(model, date) {
      model = (model !== undefined) ? new Date(model) : model;
      date = new Date(date);
      return model && model.getFullYear() === date.getFullYear();
    },
    isSameMonth : function(model, date) {
      model = (model !== undefined) ? new Date(model) : model;
      date = new Date(date);
      return this.isSameYear(model, date) && model.getMonth() === date.getMonth();
    },
    isSameDay : function(model, date) {
      model = (model !== undefined) ? new Date(model) : model;
      date = new Date(date);
      return this.isSameMonth(model, date) && model.getDate() === date.getDate();
    },
    isSameHour : function(model, date) {
      model = (model !== undefined) ? new Date(model) : model;
      date = new Date(date);
      return this.isSameDay(model, date) && model.getHours() === date.getHours();
    },
    isSameMinutes : function(model, date) {
      model = (model !== undefined) ? new Date(model) : model;
      date = new Date(date);
      return this.isSameHour(model, date) && model.getMinutes() === date.getMinutes();
    },
    isValidDate : function(value) {
      // Invalid Date: getTime() returns NaN
      return value && !(value.getTime && value.getTime() !== value.getTime());
    }
  };
});
/* 
 * dateRange Directive
 * @library https://github.com/g00fy-/angular-datepicker
 * 
 * date: 6/22/2015
 * @modified Michael Chin
 */

/*
 * dateRange Directive
 */
Module.directive('dateRange', function () {
    return {
        require: '^datePickerApp',
        templateUrl: 'templates/daterange.html',
        scope: {
            start: '=',
            end: '=',
            isMobile: '='
        },
        controller: ["$scope", function($scope) {
            $scope.isPrevMonthValid = false;
            $scope.currentViewDate = new Date();
        }],
        link: function (scope, element, attrs, cntrl) {
            /*
             * evaluatePrevMonthValid
             * 
             * Updates the isPrevMonthValid flag by checking if the previous
             * month of the current view date is before today's date.
             * 
             * @returns {undefined}
             */
            function evaluatePrevMonthValid() {
                scope.prevViewDate = cntrl.getPrevMonth(scope.currentViewDate);
                var today = new Date();
                if(scope.prevViewDate.getTime() < today.getTime()) {
                    scope.isPrevMonthValid = false;
                    return;
                }
                scope.isPrevMonthValid = true;
            }
            
            /* 
             * Broadcast Event
             * 
             * Tell the datePicker to change months whenever a next/prev call
             * is made on the dateRange
             * 
             * @author Michael C
             */
            scope.next = function () {
                incViewDate();
                evaluatePrevMonthValid();
                scope.$broadcast("next");
            };
            scope.prev = function() {
                decViewDate();
                evaluatePrevMonthValid();
                scope.$broadcast("prev");
            };
            
            function incViewDate() {
                scope.currentViewDate = cntrl.getNextMonth(scope.currentViewDate);
            }
            
            function decViewDate() {
                scope.currentViewDate = cntrl.getPrevMonth(scope.currentViewDate);
            }
            
            /*
            * Listener
            * 
            * Calls the function to change the start/end inputs whenever a new 
            * date is selected on the calendar
            * 
            * @author Michael C
            */
           scope.$on('dateChange', function(event, date) {
              processChange(date);
           });
           
           /*
            * getNextDay
            * 
            * Returns a new date object that is one day ahead of the passed
            * in date object
            * 
            * @param javascript Date object
            * @returns javascript Date object
            * 
            * @author Michael C
            */
           function getNextDay(date) {
               return cntrl.getDayAfterNumDays(date, 1);
           }
      
            /*
             * processChange
             * 
             * Hack to cover the calendar.  Currently, the calendars act as two
             * individual start/end datePickers.  We need to ignore that fact,
             * and add our own evaluation to decide whether or not we looking
             * at the start/end dateRange
             * 
             * @param javascript Date object - date selected on either datePicker
             * 
             * @author Michael C
             */
            function processChange(value) {
                //console.log("Calendar clicked");
                //If we are working with the start input
                if(cntrl.getStartCal()) {
                    cntrl.setSelectedStartDate(value); 
                }
                //If we are working with the end input
                else {
                    cntrl.setSelectedEndDate(value);
                }
                //Autoclose after selection
                cntrl.updateDateRange();
            }
            
            attrs.$observe('disabled', function(isDisabled){
                scope.disableDatePickers = !!isDisabled;
            });
        }
    };
});
/* 
 * dateInput Directive
 * 
 * Directive to handle dateInputs that handle formatted date
 * 
 * date: 7/2/2015
 * @author Michael C
 */

/*
 * 
 * 
 */

Module.directive('dateInput', function() {
    return {
        require: '?ngModel',
        scope: {
            dateValue: '='
        },
        controller: ["$scope",  function($scope) {
            $scope.fixDate = function(d){
                //var newDate = new Date.create(d).toString();
                ////console.log(newDate);
                $scope.dateValue = "help";

            };
        }],
        link: function(scope, element, attrs, ngModel) {
            
        }			
    };
});
/*
 * datePickerApp Directive
 * 
 * date: 6/22/2015
 * @author Michael C
 */


/*
 * datePickerApp Directive
 */
Module.directive('datePickerApp', ['$timeout','$window', function($timeout, $window) {
  return {
    templateUrl: 'templates/datepickerapp.html',
    scope: {
        formStartDate: '=fromDate', //Raw values passed to the form
        formEndDate: '=toDate',
        viewMode: '@',
        dateOutputFormat: '@', 
        //dateLegalFormats: '='
        startPlaceholderText: '@',
        endPlaceholderText: '@',
        minStartDate: '@',
        maxStartDate: '@',
        minEndDate: '@',
        maxEndDate: '@',
        maxEndDateFromToday: '@',
        maxEndDateOffset: '@',
        maxStartDateOffset: '@',
        closeDelay: '@'
    },
    //Define controller functions to be passed down to the datePicker directive
    controller: ["$scope", function($scope) {
        /*
         * Directive attribute defaults
         */
        
        //Flag to check whether we are picking the start or end date
        $scope.startCal = null;
        //Controls whether or not the dateRange is visible
        $scope.isOpen = false; 
        //Control what view mode we default to
        $scope.viewMode = ($scope.viewMode || "doubleDate");
        ($scope.viewMode == "singleDate") ? $scope.isSingle = true : $scope.isSingle = false;
        //Let us know whether or not an input is in focus
        $scope.startIsFocused = false;
        $scope.endIsFocused = false;
        //Amount of delay set after choosing an end date
        $scope.closeDelay = ($scope.closeDelay || 1000);
        //Visual date format
        $scope.dateOutputFormat = ($scope.dateOutputFormat || "MMM DD YYYY");
        $scope.dateOutputNoYearFormat = removeY($scope.dateOutputFormat);
        //Text placed in empty input fields
        $scope.startPlaceholderText = ($scope.startPlaceholderText || "");
        $scope.endPlaceholderText = ($scope.endPlaceholderText || "");
        //Calculate necessary dimensions to figure out if we are mobile/desktop view
        $scope.window = angular.element($window);
        $scope.windowMode = getWindowMode();
        
        //CONTROLLER Variables utilized by child directives

        //Zero out all dates
        this.minStartDate = new Date($scope.minStartDate || new Date()).setHours(0, 0, 0, 0);
        this.maxStartDate = new Date($scope.maxStartDate).setHours(0, 0, 0, 0);
        this.minEndDate = new Date($scope.minEndDate || new Date()).setHours(0, 0, 0, 0);
        //Use maxEndDate if it exists, or calculate it by the relative offset
        this.maxEndDate = ($scope.maxEndDate || ($scope.maxEndDateFromToday ? getDayAfterNumDays(new Date(), $scope.maxEndDateFromToday) : null));
        this.maxEndDate = new Date(this.maxEndDate).setHours(0, 0, 0, 0);
        this.maxEndDateOffset = ($scope.maxEndDateOffset || null);
        
        /*
         * removeY
         * 
         * Removes all Y and whitespace chars from a string
         * 
         * @param {string} str
         * @returns {string}
         */
        function removeY(str) {
            var pattern = "Y";
            var reg = new RegExp(pattern, "g");
            str = str.replace(reg, "");
            return str.replace(/(^\s*,)|(,\s*$)/g, '');
        }
        
        
        function getWindowMode() {
            var mode = "";
            if(evo$('body').hasClass('mode-xs')) {mode = 'mode-xs';}
            if(evo$('body').hasClass('mode-sm')) {mode = 'mode-sm';}
            if(evo$('body').hasClass('mode-md')) {mode = 'mode-md';}
            if(evo$('body').hasClass('mode-lg')) {mode = 'mode-lg';}

            return mode;
        }
        $scope.window.bind('resize', function () {
                var oldMode = $scope.windowMode;
                $scope.windowMode = getWindowMode();
                //console.log($scope.isMobile);
                if($scope.windowMode == 'mode-xs') {
                    $scope.isMobile = true;
                    if(oldMode != 'mode-xs') {
                        $scope.isOpen = false;
                        evo$('body').trigger("click");
                    }
                }
                else {
                    $scope.isMobile = false;
                    if(oldMode == 'mode-xs') {
                        $scope.isOpen = false;
                        evo$('body').trigger("click");
                    }
                }
        });
        evo$('body').trigger("resize");
        
        var maxEndDates = new Array();
        
        //GETTER METHODS
        this.getMaxEndDate = function() {
            if($scope.selectedStartDate != null) {
                var date = $scope.selectedStartDate;
                if(maxEndDates[date] == null) {
                    maxEndDates[date] = getDayAfterNumDays(date, this.maxEndDateOffset);
                }
                return maxEndDates[date];
            }
            return null;
        };
       
        this.getSelectedStartDate = function() {
            return $scope.selectedStartDate;
        };
        this.getSelectedEndDate = function() {
            return $scope.selectedEndDate;
        };
        
        /*
         * updateDateRange
         * 
         * Handles the various actions that can occur when a date is selected
         * on the calendar
         * 
         */
        this.updateDateRange = function() {
            //Close the calendar
            if($scope.viewMode == "doubleDate") {
                $scope.startCal ? this.toggleStartCal() : this.closeDateRange();
            }
            //Cycle through start --> end --> close
            else if($scope.viewMode == "singleDate") {
                $scope.startCal ? this.toggleStartCal() : this.closeDateRange();
            }
            else {
                this.closeDateRange(); 
            }
        };
        
        /*
         * Mutators to change the visibility of the dateRange
         * @return boolean
         */
        $scope.openDateRange = function() {
            $timeout.cancel($scope.closeTimeout); //clear any timeouts
            //Reupdate the calendar view by broadcasting an event down
            $scope.$broadcast('updateView');
            $scope.isOpen = true;
        };
        this.closeDateRange = function() {
            //Create a timeout to delay the close
            $scope.closeTimeout = $timeout(function() {
                $scope.isOpen = false;
            }, $scope.closeDelay);
        };
        
        /*
         * toggleStartCal
         * 
         * Toggles $scope.startCal
         * 
         */
        this.toggleStartCal = function() {
            $scope.startCal = !$scope.startCal;
        };
        
        /*
         * getdayAfterNumDays
         * 
         * Returns a new date object that is numDays amount of days past the
         * given date object
         * 
         * @param javascript Date object
         * @param int numDays
         * @returns javascript Date object
         */
        function getDayAfterNumDays(date, numDays) {
            var newDay = new Date(date);
            newDay.setDate(newDay.getDate() + parseInt(numDays));
            return newDay;
        };
        
        //Pass the variable down
       // this.maxStartDateOffset = getDayAfterNumDays(new Date(), $scope.maxStartDate);
        
        /*
         * getNextDay
         * 
         * Returns a new date object that is one day ahead of the passed
         * in date object
         * 
         * @param javascript Date object
         * @returns javascript Date object
         * 
         * @author Michael C
         */
        $scope.getNextDay = function(date) {
            return getDayAfterNumDays(date, 1);
        };
        
        /*
         * Mutator for the isFocused flag
         * 
         * @param string value
         */
        $scope.setFocus = function(type, value) {
            if(type == "start") {
                $scope.startIsFocused = value;
            }
            else {
                $scope.endIsFocused = value;
            }
        };
        
        /*
         * Mutator for the startCal flag
         * 
         * @param boolean value
         */
        $scope.setStartCal = function(value) {
            $scope.startCal = value;
        };
        
        
        /*
         * Accessor for the startCal flag
         * @return boolean
         */
        this.getStartCal = function() {
            return $scope.startCal;
        };
        
        /*
         * getViewDate
         * 
         * Receives the id of the datePicker requesting the viewDate and
         * returns its respective view date
         * 
         * @param int id
         * @returns javascript Date object
         */
        this.getViewDate = function(id) {
            //If a start date exists.. base the calendar view off that
            if($scope.isDate($scope.selectedStartDate)) {
                if(id == 0) {
                    return $scope.selectedStartDate;
                }
                return this.getNextMonth($scope.selectedStartDate);
            }
            //If an end date exists.. base the calendar view off that
            else if($scope.isDate($scope.selectedEndDate)) {
                if(id == 0) {
                    return this.getPrevMonth($scope.selectedEndDate);
                }
                return $scope.selectedEndDate;
            }
            //If nothing exists.. base the calendar view off today
            if(id == 0) {
                return new Date();
            }
            return this.getNextMonth(new Date());
        };
        
        /*
         * getNextMonth
         * 
         * Returns a new date object that is one month ahead of the passed date
         * object
         * 
         * @param javascript Date object
         * @returns javascript Date object
         */
        this.getNextMonth = function(date) {
            if (date == 11) {
                return new Date(date.getFullYear() + 1, 0, 1);
            }
            return new Date(date.getFullYear(), date.getMonth() + 1, 1);
        };
        
        /*
         * getPrevMonth
         * 
         * Returns a new date object that is one month before the passed date
         * object
         * 
         * @param javascript Date object
         * @returns javascript Date object
         */
        this.getPrevMonth = function(date) {
            if (date == 1) {
                return new Date(date.getFullYear() - 1, 0, 1);
            }
            return new Date(date.getFullYear(), date.getMonth(), 0);
        };
        
        this.setSelectedStartDate = function(value) {
            $scope.setSelectedStartDate(value);
        };
        this.setSelectedEndDate = function(value) {
            $scope.setSelectedEndDate(value);
        };
    }],
    link: function (scope, element, attrs) {
        //Default to the "L" format
        scope.dateFormat = (scope.dateFormat || "L");
        
        /*
         * One Way Bind formDate to selectedDate
         * 
         * Convert form string into Date object
         */
        scope.$watch('formStartDate', function(value) {
            setSelecteddStartDate(new Date(value));
        });
        scope.$watch('formEndDate', function(value) {
            setSelecteddEndDate(new Date(value));
        });
        
        /*
         * 
         * @param {type} date
         * @returns {undefined}
         */
        function setSelecteddStartDate(date) {
            scope.selectedStartDate = date;
            scope.visualStartDate = formatDateInput(date);
        }
        function setSelecteddEndDate(date) {
            scope.selectedEndDate = date;
            scope.visualEndDate = formatDateInput(date);
        }
        
        /*
         * Validates a date object
         * 
         * @param javascript Date object d
         * @returns boolean
         */
        scope.isDate = function(d) {
            if ( Object.prototype.toString.call(d) === "[object Date]" ) {
                // it is a date
                if ( isNaN( d.getTime() ) ) {  // d.valueOf() could also work
                  // date is not valid
                }
                else {
                  return true;
                }
            }
            
            return false;
        }
        
        /*
         * scope.$watch
         * 
         * Updates the calendar everytime a new input start/end date is entered
         */
        scope.calChange = function(calType) {
          scope.updateDate(calType);  
        };
        
        /*
         * updateDate -- called on ng-blur
         * 
         * Updates the calendar's start/end date based on the input's start/end
         * date when the user leaves the input box
         * 
         * This makes the input boxes default if there is invalid input
         * 
         * @param string value
         */
        scope.updateDate = function(calType) { 
            var selectedDate = function(x) { scope.selectedEndDate = x };
            var date = scope.visualEndDate;
            if(calType === "start") {
                //Hack to pass by reference?
                selectedDate = function(x) { scope.selectedStartDate = x };
                date = scope.visualStartDate;
            }

            scope.setFocus(calType, false);
            //Make sure it isn't null -- so we don't automatically present a default date
            if(date != null) {
                if(scope.isDate(reverseDateInputFormat(date)) || date == "") {
                    selectedDate(reverseDateInputFormat(date));
                }
            }
        }; 
        
        /*
         * formatDateInput
         * 
         * The format that will appear to the user in the input boxes
         * 
         * @unused 
         * 
         * @param javascript Date object
         * @return string "mm/dd/yyyy"
         */
        function formatDateInput(date) {
            if(scope.isDate(date)) {
                var date = moment(date);
                var dateOutputFormat = scope.dateOutputFormat;
                if(date.isSame(new Date, 'year')) {
                    dateOutputFormat = scope.dateOutputNoYearFormat;
                }
                return date.format(dateOutputFormat);
            }
            return "";
        }
        
        /*
         * reverseDateInputFormat
         * 
         * Parses the date format in the input boxes back to ISO 8601
         * 
         * @param string date
         * @returns javascript Date object
         */
        function reverseDateInputFormat(date) {
            //True designates strict parsing
            var momentDate = moment(date, scope.dateOutputFormat, true);
            return new Date(momentDate.format());
        }
        
        
        /*
         * scope.$watch
         * 
         * Updates the inputs everytime a new date is selected on the calendar
         * 
         * @param javascript Date object
         * 
         * @author Michael C
         */
        /*
        scope.$watch('selectedStartDate', function(date) {
            if(date != null) {
                setSelectedStartDate(date);
            }
        });
        scope.$watch('selectedEndDate', function(date) {
            if(date != null) {
                setSelectedEndDate(date);
            }
        }); */
        
        function setFormStartDate(date) {
            if(scope.isDate(date)) {
                scope.formStartDate = date.toISOString();
            }
            else {
                scope.formStartDate = "";
            }
        }
        
        function setFormEndDate(date) {
            if(scope.isDate(date)) {
                scope.formEndDate = date.toISOString();
            }
            else {
                scope.formEndDate = "";
            }
        }
        
        /*
         * Mutator
         * 
         * Whenever the calendar is changed, we need to update our true value
         * and the visual value displayed
         * 
         * @returns {undefined}
         */
        scope.setSelectedStartDate = function(date) {
            scope.selectedStartDate = date;
            
           if(scope.isDate(date)) {scope.formStartDate = date.toISOString();} 
           //setFormStartDate(date);
            
            
            if(!scope.startIsFocused) {
                scope.visualStartDate = formatDateInput(date);
            }
            
            //console.log(scope.selectedStartDate);
            //If the new start is past the end
            if(scope.selectedEndDate != "" && (scope.selectedStartDate > scope.selectedEndDate || !scope.isDate(scope.selectedEndDate))) {
                scope.setSelectedEndDate("");
            }
        }
        scope.setSelectedEndDate = function(date) {
            scope.selectedEndDate = date;
            
            if(scope.isDate(date)) {scope.formEndDate = date.toISOString();} 
            //setFormEndDate(date);
            
            if(!scope.endIsFocused) {
                scope.visualEndDate = formatDateInput(date);
            }
            //If the start date is not set or the new end is before the start
            if(scope.selectedEndDate != "" &&  (scope.selectedEndDate <= scope.selectedStartDate || !scope.isDate(scope.selectedStartDate))) {
                //console.log("Removing Start Date");
                scope.setSelectedStartDate("");
                //console.log("Selected Start Date")
                //console.log(scope.selectedStartDate);
            }
        }
        
        
        /*
         * Listener
         * 
         * Changes the start/end inputs whenever a new date is selected on the
         * calendar
         * 
         */
        scope.$on('dateChange2', function(event, pickerId, date) {
           switch(pickerId) {
               case 0: 
                   setSelectedStartDate(date);
                   break;
               case 1: 
                   setSelectedEndDate(date);
                   break;
           }
        });
    }
  };
}]);


var PRISTINE_CLASS = 'ng-pristine',
    DIRTY_CLASS = 'ng-dirty';

Module.constant('dateTimeConfig', {
  template: function (attrs) {
    return '' +
        '<div ' +
        'date-picker="' + attrs.ngModel + '" ' +
        (attrs.view ? 'view="' + attrs.view + '" ' : '') +
        (attrs.maxView ? 'max-view="' + attrs.maxView + '" ' : '') +
        (attrs.autoClose ? 'auto-close="' + attrs.autoClose + '" ' : '') +
        (attrs.template ? 'template="' + attrs.template + '" ' : '') +
        (attrs.minView ? 'min-view="' + attrs.minView + '" ' : '') +
        (attrs.partial ? 'partial="' + attrs.partial + '" ' : '') +
        (attrs.step ? 'step="' + attrs.step + '" ' : '') +
        'class="date-picker-date-time"></div>';
  },
  format: 'yyyy-MM-dd HH:mm',
  views: ['date', 'year', 'month', 'hours', 'minutes'],
  dismiss: false,
  position: 'relative'
});



Module.directive('dateTimeAppend', function () {
  return {
    link: function (scope, element) {
      element.bind('click', function (e) {
          //console.log("e is: " + e);
        element.find('input')[0].focus();
      });
    }
  };
});

Module.directive('dateTime', ['$compile', '$document', '$filter', 'dateTimeConfig', '$parse', 'datePickerUtils',
                function ($compile, $document, $filter, dateTimeConfig, $parse, datePickerUtils) {
  var body = $document.find('body');
  var dateFilter = $filter('date');

  return {
    require: 'ngModel',
    scope:true,
    link: function (scope, element, attrs, ngModel) {
      var format = attrs.format || dateTimeConfig.format;
      var parentForm = element.inheritedData('$formController');
      var views = $parse(attrs.views)(scope) || dateTimeConfig.views.concat();
      var view = attrs.view || views[0];
      var index = views.indexOf(view);
      var dismiss = attrs.dismiss ? $parse(attrs.dismiss)(scope) : dateTimeConfig.dismiss;
      var picker = null;
      var position = attrs.position || dateTimeConfig.position;
      var container = null;

      if (index === -1) {
        views.splice(index, 1);
      }

      views.unshift(view);


      function formatter(value) {
        return dateFilter(value, format);
      }

      function parser() {
        return ngModel.$modelValue;
      }

      ngModel.$formatters.push(formatter);
      ngModel.$parsers.unshift(parser);


      //min. max date validators
      if (angular.isDefined(attrs.minDate)) {
        var minVal;
        ngModel.$validators.min = function (value) {
            return !datePickerUtils.isValidDate(value) || angular.isUndefined(minVal) || value >= minVal;
          };
        attrs.$observe('minDate', function (val) {
            minVal = new Date(val);
            ngModel.$validate();
          });
      }

      if (angular.isDefined(attrs.maxDate)) {
        var maxVal;
        ngModel.$validators.max = function (value) {
            return !datePickerUtils.isValidDate(value) || angular.isUndefined(maxVal) || value <= maxVal;
          };
        attrs.$observe('maxDate', function (val) {
            maxVal = new Date(val);
            ngModel.$validate();
          });
      }
      //end min, max date validator

      var template = dateTimeConfig.template(attrs);

      function updateInput(event) {
        event.stopPropagation();
        if (ngModel.$pristine) {
          ngModel.$dirty = true;
          ngModel.$pristine = false;
          element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
          if (parentForm) {
            parentForm.$setDirty();
          }
          ngModel.$render();
        }
      }

      function clear() {
        if (picker) {
          picker.remove();
          picker = null;
        }
        if (container) {
          container.remove();
          container = null;
        }
      }

      function showPicker() {
        if (picker) {
          return;
        }
        // create picker element
        picker = $compile(template)(scope);
        scope.$digest();

        scope.$on('setDate', function (event, date, view) {
          updateInput(event);
          if (dismiss && views[views.length - 1] === view) {
            clear();
          }
        });

        scope.$on('hidePicker', function () {
          element.triggerHandler('blur');
        });

        scope.$on('$destroy', clear);

        // move picker below input element

        if (position === 'absolute') {
          var pos = angular.extend(element.offset(), { height: element[0].offsetHeight });
          picker.css({ top: pos.top + pos.height, left: pos.left, display: 'block', position: position});
          body.append(picker);
        } else {
          // relative
          container = angular.element('<div date-picker-wrapper></div>');
          element[0].parentElement.insertBefore(container[0], element[0]);
          container.append(picker);
//          this approach doesn't work
//          element.before(picker);
          picker.css({top: element[0].offsetHeight + 'px', display: 'block'});
        }

        picker.bind('mousedown', function (evt) {
          evt.preventDefault();
        });
      }

      element.bind('focus', showPicker);
      element.bind('blur', clear);
    }
  };
}]);
