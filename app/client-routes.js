// Setting up route
var myApp = angular.module('myApp', ['ui.router']);

myApp.config(function($stateProvider) {

        $stateProvider
            .state('paintingAgainstHumanity', {
                url: '/roomid',
                // templateUrl: 'app/painting-against-humanity.html',
                template: '<h3>losdasdasdl</h3>',
                // controller: 'PaintingAgainstHumanityController'
            })
            .state('chatRoom', {
                url: 'room',
                templateUrl: 'chat-room.html'
            });

    }
);