;(function(){
    function authInterceptor(API, auth) {
      return {
        // automatically attach Authorization header
        request: function(config) {
          return config;
        },
    
        // If a token was sent back, save it
        response: function(res) {
          if(res.config.url.indexOf(API) === 0 && res.data.token) {
            auth.saveToken(res.data.token);
          }        
          return res;
        },
      }
    }
    
    function authService($window) {
      var self = this;
      self.parseJwt = function(token) {
        var base64Url = token.split('.')[1]; //fetching the claims
        var base64 = base64Url.replace('-', '+').replace('_', '/'); // convert the string to the standard of base 64 of which it actually is
        return JSON.parse($window.atob(base64));// atob decodes the base 64, then we parse the JSON
      }

      console.log(self.parseJwt("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImhpbWFuc2h1IiwiaWQiOjAsImV4cCI6MTU2MDYwNjUwNiwiaWF0IjoxNTYwNTIwMTA2fQ.h5J0-TjGHCfP-fGvv46OytQVrfm08WPnjYiuA2AIZtQ"));
      //Note: Expiration Date is unix timestamp in epoch

      self.saveToken = function(token) {
        $window.localStorage['jwtToken'] = token;
      }

      self.getToken = function() {
        return $window.localStorage['jwtToken'];
      }

      self.isAuthed = function() {
        var token = self.getToken();
        if(token) {
          var params = self.parseJwt(token);
          return Math.round(new Date().getTime() / 1000) <= params.exp;
        } else {
          return false;
        }
      }

      console.log("token loaded: ", self.getToken());
      console.log("am I authed: ", self.isAuthed());
    }
    
    function userService($http, API, auth) {
      var self = this;
      self.getQuote = function() {
        return $http.get(API + '/auth/quote')
      }
    
      self.register = function(username, password) {
        return $http.post(API + '/auth/register', {
            username: username,
            password: password
          })
      }

      self.login = function(username, password) {
        return $http.post(API + '/auth/login', {
            username: username,
            password: password
          })
      };
    
    }

    
    
    // We won't touch anything in here
    function MainCtrl(user, auth, $window) {
      var self = this;
    
      function handleRequest(res) {
        var token = res.data ? res.data.token : null;
        if(token) { console.log('JWT:', token); }
        self.message = res.data.message;
      }
    
      self.login = function() {
        user.login(self.username, self.password)
          .then(handleRequest, handleRequest)
      }
      self.register = function() {
        user.register(self.username, self.password)
          .then(handleRequest, handleRequest)
      }
      self.getQuote = function() {
        user.getQuote()
          .then(handleRequest, handleRequest)
      }
      self.logout = function() {
        auth.logout && auth.logout()
      }

      self.logout = function() {
        $window.localStorage.removeItem('jwtToken');
      }
      self.isAuthed = function() {
        return auth.isAuthed ? auth.isAuthed() : false
      }
    }
    
    angular.module('app', [])
    .factory('authInterceptor', authInterceptor)
    .service('user', userService)
    .service('auth', authService)
    .constant('API', 'http://test-routes.herokuapp.com')
    .config(function($httpProvider) {
      $httpProvider.interceptors.push('authInterceptor');
    })
    .controller('Main', MainCtrl)
    })();