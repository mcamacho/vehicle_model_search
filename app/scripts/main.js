/*global _*/
'use strict';
angular.module('vehicleModelSearchApp', ['ngRoute', 'ngAnimate'])
  .config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'views/main.html'
        })
        .when('/model/:model', {
          controller: 'trimCtrl',
          templateUrl: 'views/trim.html'
        })
        .when('/model/:model/trim/:trim', {
          controller: 'colorCtrl',
          templateUrl: 'views/color.html'
        })
        .when('/model/:model/trim/:trim/color/:extColorCode', {
          controller: 'quoteCtrl',
          templateUrl: 'views/quote.html'
        })
        .otherwise({
          redirectTo: '/'
        });
      $locationProvider.html5Mode(false);
    }
  ])
  .constant('_', _)
  .controller('trimCtrl', function ($scope, $log, $routeParams) {
    $scope.$watch('baseF', function (newv) {
      if (newv) {
        var index = _.findIndex($scope.baseF.modelTrim, $routeParams);
        $scope.subase = {
          ele: index,
          current: $scope.baseF.modelTrim[index].trimuniq[0]
        };
      }
    });
  })
  .controller('colorCtrl', function ($scope, $log, $routeParams) {
    $scope.$watch('baseF', function (newv) {
      if (newv) {
        var index = _.findIndex($scope.baseF.modelTrimColor, $routeParams);
        $scope.subase = {
          ele: index,
          modelsel: $routeParams.model,
          current: $scope.baseF.modelTrimColor[index].colors[0]
        };
      }
    });
  })
  .controller('quoteCtrl', function ($scope, $window, $log, $routeParams, $http) {
    $scope.formPrint = function () {
      $window.print();
    };
    $scope.snowpush = function () {
      // filter mform
      var mformData = {};
      if ($scope.mform.quoteTypeSelected === 'lease') {
        mformData = _.omit($scope.mform, 'financeTerm');
        mformData['dForm-Subject'] = 'lease';
      } else if ($scope.mform.quoteTypeSelected === 'finance') {
        mformData = _.omit($scope.mform, ['leaseTerm', 'leaseMilesYear']);
      } else if ($scope.mform.quoteTypeSelected === 'purchase') {
        mformData = _.omit($scope.mform, ['creditRating', 'financeTerm', 'leaseTerm', 'leaseMilesYear']);
      }
      var datar = _.pairs(mformData).join('&').replace(/,/g,'=');
      $http({
        method: 'GET',
        // method: 'POST',
        url: '../',
        // url: '{home}/',
        data: datar,
        headers: {
          'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
        }
      })
      .success(function () {
        if ($window._snaq) {
          var fields = _.pairs(mformData).join('&').replace(/,/g,':');
          var prop = $scope.subase.current.year +','+ $scope.subase.current.model +','+ $scope.subase.current.trim +','+ $scope.subase.current.extColorCode;
          $window._snaq.push(['trackStructEvent', 'webform', 'form-fields', fields, prop, '']);
          $window._snaq.push(['trackStructEvent', 'webform', 'form-submit', 'instock-quote', prop, '']);
          $scope.subase.thankyou = true;
        }
      });
    };
    $scope.$watch('base.collection', function (newv) {
      if (newv) {
        $scope.subase = {
          current: _.find($scope.base.collection, $routeParams),
          // elementHash: '{element_hash}',
          elementHash: 'elementHash',
          modelsel: $routeParams.model,
          trimsel: $routeParams.trim
        };
        $scope.mform = {
          'first_name-r': '',
          'last_name-r': '',
          'email-r': '',
          'dForm': $scope.subase.current.vin,
          'dForm-ID': $scope.subase.elementHash,
          'dForm-Subject': 'buy',
          'quoteTypeSelected': 'lease',
          'creditRating': 'great',
          'leaseTerm': '24',
          'leaseMilesYear': '10000',
          'financeTerm': '24'
        };
      }
    });
  })
  .controller('baseCtrl', function ($scope, $log, $http) {
    var basicParams = {
      f: 'json',
      show: 'all',
      type: 'new',
      d: 'vehicles',
      e: 'trim,evox_vif,ext_color_code'
    };
    var groupParams = _.assign({
      q: 'group=year,model,trim,exterior_color',
      k: 'year,model,trim,evox_vif,ext_color_code=extColorCode,exterior_color,msrp,vin'
    }, basicParams);
    var inventoryParams = _.assign({
      k: 'year,model,trim,ext_color_code=extColorCode'
    }, basicParams);
    var cleanData = function (data) {
      return _.map(data, function (ele) {
        return _.assign(ele, {
          modelLabel: ele.model,
          trimLabel: ele.trim,
          model: ele.model.replace(/[ ]/g, '_'),
          trim: ele.trim.replace(/[/]/g, '+').replace(/[ ]/g, '_')
        });
      });
    };
    var createTree = function (data) {
      var tree = {};
      // tree.ttsrc = '{src}';
      tree.yearArray = _.map(_.uniq(data, 'year'), function (ele) {
        ele.yearlabel = ele.year;
        return ele;
      });
      tree.yearSelected = tree.yearArray[0];
      tree.collection = _.sortBy(data, 'extColorCode').reverse();
      return tree;
    };
    var isNum = function (obj) {
      return _.isNaN(parseInt(obj, 10)) ? '' : obj;
    };
    var filterCollection = function () {
      var data = _.where($scope.base.collection, { year: $scope.base.yearSelected.year });
      var tree = {};
      tree.models = (function () {
        var msrpuniq = _.uniq(_.sortBy(data, 'msrp'), 'model');
        var modeluniq = _.map(_.uniq(data, 'model'), function (ele) {
          ele.msrpmodel = isNum(_.find(msrpuniq, { model: ele.model }).msrp);
          return ele;
        });
        return _.sortBy(modeluniq, 'model');
      }());
      tree.modelTrim = _.map(tree.models, function (ele) {
        var trims = _.where(data, {
          model: ele.model
        });
        var trimsort = _.sortBy(trims, 'msrp');
        return {
          model: ele.model,
          trimuniq: _.sortBy(
            _.map(
              _.uniq(trims, 'trim'), function (ele) {
                ele.msrptrim = isNum(_.find(trimsort, { trim: ele.trim }).msrp);
                return ele;
              }
            ), 'msrp')
        };
      });
      tree.modelTrimColor = _.flatten(_.map(tree.modelTrim, function (ele) {
        var trimarray = _.map(ele.trimuniq, function (oto) {
          var colors = _.where(data, {
            model: oto.model,
            trim: oto.trim
          });
          return {
            model: oto.model,
            trim: oto.trim,
            colors: _.sortBy(
              _.map(_.uniq(colors, 'extColorCode'), function (ele) {
                ele.msrp = isNum(ele.msrp);
                return ele;
              }), 'msrp')
          };
        });
        return trimarray;
      }));
      return tree;
    };
    var splityear = function (data) {
      // split the inventory collection by year
      // $log.info('yearArray',$scope.base.yearArray);
      var split = [];
      for (var i = $scope.base.yearArray.length - 1; i >= 0; i--) {
        split.push({
          year: $scope.base.yearArray[i].year,
          vehicles: _.where(data, { year: $scope.base.yearArray[i].year })
        });
      }
      return split;
    };
    // var updateYearSel =  function () {
    //   // modify yearArray -> yearlabel
    //   _.forEach($scope.base.yearArray, function (ele) {
    //     var yearele = _.find($scope.vehicles, { year: ele.yearlabel });
    //     ele.yearlabel = ele.yearlabel + ' - (' + yearele.vehicles.length + ' in Stock)';
    //   });
    // };
    var countCollection = function () {
      // process the inventory and assign the new attribute to the base.collection
      if (_.isEmpty($scope.baseF.models[0].modelCount)) {
        var vehicleset = _.find($scope.vehicles, { year: $scope.base.yearSelected.year }).vehicles;
        _.forEach($scope.baseF.models, function (ele) {
          ele.modelCount = _.where(vehicleset, { model: ele.model }).length;
        });
        _.forEach($scope.baseF.modelTrim, function (ele) {
          _.forEach(ele.trimuniq, function (sub) {
            sub.trimCount = _.where(vehicleset, { model: ele.model, trim: sub.trim }).length;
          });
        });
        _.forEach($scope.baseF.modelTrimColor, function (ele) {
          _.forEach(ele.colors, function (sub) {
            sub.colorCount = _.where(vehicleset, { model: ele.model, trim: ele.trim, extColorCode: sub.extColorCode }).length;
          });
        });
      }
    };
    var getData = function () {
      $http({
        // method: 'POST',
        method: 'GET',
        // url: '{home}/api/',
        url: 'model.json',
        params: _.assign({ make: $scope.makes.dealerMake }, groupParams)
      })
      .success(function (data) {
        $scope.base = createTree(cleanData(data));
        // get complete inventory and count by year/model, year/trim, year/color
        $http({
          // method: 'POST',
          method: 'GET',
          // url: '{home}/api/',
          url: 'inventory.json',
          params: _.assign({ make: $scope.makes.dealerMake }, inventoryParams)
        })
        .success(function (data) {
          $scope.vehicles = splityear(cleanData(data));
          // $log.info(data.length);
        });
      });
    };
    var initApp = function () {
      // var multipleMakes = parseInt('{setup_my_available_makes}' || '0', 10);
      var multipleMakes = parseInt('1' || '0', 10);
      if (multipleMakes > 0) {
        $scope.makes.collection = [
          { make: '{setup_dealer_primary_make}' },
          { make: '{setup_dealer_secondary_make_1}' }
        ];
        if (multipleMakes > 1) {
          $scope.makes.collection.push({ make: '{setup_dealer_secondary_make_2}' });
          if (multipleMakes > 2) {
            $scope.makes.collection.push({ make: '{setup_dealer_secondary_make_3}' });
            if (multipleMakes > 3) {
              $scope.makes.collection.push({ make: '{setup_dealer_secondary_make_4}' });
            }
          }
        }
        $scope.makes.makeSelected = $scope.makes.collection[0];
      } else {
        $scope.makes.dealerMake = '{setup_dealer_primary_make}';
        getData();
      }
    };
    $scope.base = {};
    $scope.vehicles = [];
    $scope.makes = {
      dealerMake: ''
    };
    $scope.$watch('makes.makeSelected', function (newv) {
      if (!_.isEmpty(newv)) {
        $scope.makes.dealerMake = $scope.makes.makeSelected.make;
        getData();
      }
    }, true);
    $scope.$watch('base.yearSelected', function (newv) {
      if (newv) {
        $scope.baseF = filterCollection();
        if (!_.isEmpty($scope.vehicles)) {
          countCollection();
        }
      }
    });
    $scope.$watch('vehicles', function (newv) {
      if (!_.isEmpty(newv)) {
        //updateYearSel();
        countCollection();
      }
    });
    initApp();
  });
