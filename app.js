var mdns = require('mdns');
var http = require('http');
var https = require('https');

var whosPlayingApp = angular.module('whosPlayingApp', []);

whosPlayingApp.controller('MainController', function MainController($scope, $timeout, $interval) {
  var browser = mdns.createBrowser(mdns.tcp('spotify-connect'));
  $scope.devices = [];

  $scope.getCurrentUserFromDevice = function(device, callback) {
    console.log('Querying device at IP: ' + device.ipAddress);
    var responseData = '';
    var options = {
      host: device.ipAddress,
      path: '/spotify?action=getInfo'
    };
    requestCallback = function(response) {
      response.on('data', function(chunk) {
        responseData += chunk;
      });
      response.on('end', function() {
        var responseObject = JSON.parse(responseData);
        callback(responseObject.activeUser);
      });
      response.on('error', function() {
        console.log('Could not connect to: ' + device.ipAddress);
      });
    }
    http.request(options, requestCallback).end();
  }

  $scope.getUserFromSpotify = function(user, callback) {
    var responseData = '';
    var options = {
      host: 'api.spotify.com',
      path: '/v1/users/' + user
    };
    requestCallback = function(response) {
      response.on('data', function(chunk) {
        responseData += chunk;
      });
      response.on('end', function() {
        var responseObject = JSON.parse(responseData);
        callback(responseObject);
      });
    }
    https.request(options, requestCallback).end();
  }

  browser.on('serviceUp', function(service) {
    $timeout(function(){
      $scope.devices.push({
        'name': service.name,
        'ipAddress': service.addresses[0],
        'currentUsername' : null,
        'currentUserInfo' : null,
        'isQueryInProcess' : false
      });
    });

    $interval(function(){
      $scope.devices.forEach(function(device) {
        if (device.isQueryInProcess)
          return;

        device.isQueryInProcess = true;

        $scope.getCurrentUserFromDevice(device, function(user) {
          device.currentUsername = user;
          device.isQueryInProcess = false;
          $scope.getUserFromSpotify(user, function(spotifyUser) {
            device.currentUserInfo = spotifyUser;
          });
        });
      });
    }, 2000);
  });

  browser.start();
});