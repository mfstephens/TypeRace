;
jQuery(function($){    
    'use strict';

    var IO = {
        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('displayPlayerText', IO.onDisplayPlayerText);
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
            console.log("Client connected!");
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, mySocketId: * }}
         */
        onNewGameCreated : function(data) {
            App.gameInit(data);
        },

        onDisplayPlayerText: function(data) {
            App.displayPlayerText(data);
        }
    };

    var App = {
        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function() {
            App.bindEvents();
            App.cacheElements();
            App.displayHomeScreen();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function() {
            $('#btnCreateGame').click(App.onCreateClick);
            $('#btnJoinGame').click(App.onPlayerJoinClick);
            $('#btnSubmitText').click(App.onPlayerSubmitText);
        },

        /**
         * Cache DOM elements
         */
        cacheElements: function() {
            // Cache templates
            App.$displayArea = $("#displayArea");
            App.$homeScreen = $("#homeScreen").html();
        },

        /**
         * Default to showing the home screen for the incoming visitor
         */
        displayHomeScreen: function() {
            App.$displayArea.html(App.$homeScreen);
        },

        // GameRoom: {

        /**
         * Handler for the "Start" button on the Title Screen.
         */
        onCreateClick: function () {
            // console.log('Clicked "Create A Game"');
            IO.socket.emit('playerCreateNewGame');
        },

        onPlayerJoinClick: function () {
            var data = {
                gameId: +($("#inptJoinGame").val()),
                playerName: $("#inptPlayerName").val()
            }
            App.gameId = data.gameId;
            IO.socket.emit('playerJoinGame', data);
            console.log('Clicked "Join A Game"');
        },

        onPlayerSubmitText: function() {
            var data = {
                text: $("#chatInputWindow").val(),
                gameId: App.gameId
            }
            IO.socket.emit('playerSubmitText', data);
        },

        displayPlayerText: function(data) {
            console.log(data.text);
            $("#chatOutputWindow").text(data.text);
        },

        gameInit: function (data) {
            App.gameId = data.gameId;
            App.mySocketId = data.mySocketId;
            App.myRole = 'Host';
            App.numPlayersInRoom = 0;

            console.log("gameID: " + App.gameId);
        }
    };

    IO.init();
    App.init();

}($));
