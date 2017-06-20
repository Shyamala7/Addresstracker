var app = angular.module('locationtracker',
						['ui.router',
                        'ngCookies',
                        'ui-notification',
                        'locationTrackerServices']);
var Services = angular.module('locationTrackerServices', ['ngCookies']);


app.config(function($stateProvider, $urlRouterProvider, NotificationProvider) {

    NotificationProvider.setOptions({
        delay: 10000,
        startTop: 20,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
        positionX: 'right',
        positionY: 'top'
    });


	$urlRouterProvider.otherwise('/locationtracker');

	$stateProvider

	.state('locationtracker',{
		url:'/locationtracker',
		templateUrl:'partials/location-tracker.html',
		controller:'LocationTrackerCtrl'
	})
	.state('locationlist',{
		url:'/locationlist',
		templateUrl:'partials/location-list.html',
		controller:'LocationListCtrl'
	})
	.state('login',{
		url:'/login',
		templateUrl:'partials/login.html',
		controller:'LoginCtrl'
	})
    .state('logout',{
        url:'/logout',
        controller:'LogoutCtrl'  
    })
		
});


// service for Auth
Services.service('Auth', function($http, $state) {
    this.isLoggedIn = false;
    this.user = {};

    if (sessionStorage.getItem('AuthUser')) {
        var _Auth = angular.fromJson(sessionStorage.getItem('AuthUser'));
        this.isLoggedIn = true;
        this.basicSetupDone = true;
        this.user = _Auth.user;
    }
    
    this.getUserId = function(){
        return this.user.id;
    };
       
    this.CheckLoggedIn = function (){
        if(!this.getUserId()){
            $state.go('login');
        }
    };
});


app.directive('googleplace', function() {
    return {
        scope: { callbackFn: '&' }, 
        require: 'ngModel',
        link: function(scope, element, attrs, model) {
            var options = {
                types: []
            };
            scope.gPlace = new google.maps.places.Autocomplete(element[0], options);

            google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
                scope.$apply(function() {
                    model.$setViewValue(element.val());                
                });
                 scope.callbackFn();
            });
        }
    };
});   

app.controller('LocationTrackerCtrl', function($scope, httpService, Auth,$state) {
    Auth.CheckLoggedIn();
	$scope.state = $state.current.name;
    $scope.saveLocation = function() {
         httpService.post("http://localhost:8080/api/location",$scope.chosenPlace, Auth.getUserId()).then(function(message){
         
        });
    } 
})


app.controller('LocationListCtrl', function($scope, httpService,Auth,$state) {
    Auth.CheckLoggedIn();
    var id = Auth.getUserId();
    $scope.state = $state.current.name;
    httpService.get("http://localhost:8080/api/locationlist", id).then(function(message){
        $scope.locationlists = message;
    });
})

app.controller('LoginCtrl', function($scope, httpService, $state, Auth, $cookies, Notification) {
    
    if(Auth.getUserId()){
        $state.go('locationtracker');
    }

	$scope.onSubmit = function() {
        httpService.post("http://localhost:8080/api/authenticate",$scope.credentials).then(function(message){
            if(message.success == true) {
                Auth.isLoggedIn = true;
                Auth.user = message.data;
                sessionStorage.setItem('AuthUser', angular.toJson(Auth));
                sessionStorage.setItem('Token', message.token);
            	$state.go('locationtracker');
            } else {
                Notification.error("Incorrect Username or Password");
            }
        
        });
	}
})

app.controller('LogoutCtrl',
    function($scope, httpService, $state, Auth, $cookies) {
        sessionStorage.clear();
        Auth.isLoggedIn = false;
        Auth.basicSetupDone = false;
        Auth.user = {};
        $state.go('login');
    });

app.factory('httpService', function($http) {
    var httpService = {
      	post: function (url, data, userId) {
            var promise = $http({
                method: "POST",
                url: url,
                data: {'details':data, 'user': userId},
                contentType: "application/json; charset=utf-8",
                headers: { 'Content-Type': 'application/json' , 'x-access-token' : sessionStorage.getItem('Token')}
            }).then(function (data, status, headers, config) {
            	return data.data;
            })
            return promise;
        },
        get: function(url, data) {
        	var promise = $http({
                method: "GET",
                url: url,
                params: {'details':data, 'token': sessionStorage.getItem('Token')},
                contentType: "application/json; charset=utf-8",
                headers: { 'x-access-token' : sessionStorage.getItem('Token') }
            }).then(function (data, status, headers, config) {
            	return data.data;
            })
            return promise;
        }
    }
    return httpService;
});



  