var mdns = require('mdns');
var http = require('http');
var https = require('https');

var browser = mdns.createBrowser(mdns.tcp('spotify-connect'));
var devices = [];

browser.on('serviceUp', function(service) {
  devices.push({
    'name': service.name,
    'ipAddress': service.addresses[0],
    'currentUsername' : null,
    'currentUserInfo' : null
  });
});

browser.start();

var interval = setInterval(function() {
  devices.forEach(function(device) {
    getCurrentUserFromDevice(device, function(user) {
      device.currentUsername = user;
      if (device.currentUserInfo == null) { // TODO: check if changed
        getUserFromSpotify(user, function(spotifyUser) {
          device.currentUserInfo = spotifyUser;
        });
      }
    });
  });
  devices.forEach(function(device) {
    if (device.currentUsername != null)
      console.log(JSON.stringify(devices, null, 4));
  });
}, 5000);

function getCurrentUserFromDevice(device, callback) {
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
  }
  http.request(options, requestCallback).end();
}

function getUserFromSpotify(user, callback) {
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