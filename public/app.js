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
            IO.socket.on('connected', IO.onConnected);
            IO.socket.on('newGameCreated', IO.onNewGameCreated);
            IO.socket.on('playerJoinedRoom', IO.onPlayerJoinedRoom);
            IO.socket.on('playerAnsweredCorrectly', IO.onPlayerAnsweredCorrectly);
            IO.socket.on('playerAnsweredIncorrectly', IO.onPlayerAnsweredIncorrectly);
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
        },

        /**
         * Player has joined a room.
         */
        onPlayerJoinedRoom: function(data) {
            App.Player.onPlayerJoinedRoom(data);
        },

        onPlayerAnsweredCorrectly: function(data) {
            // Update the player's current word and replace input field with white space
            data.correct = true;
            App.Player.updateMainGameScreen(data);
        },

        onPlayerAnsweredIncorrectly: function(data) {
            // Update the player's current word and replace input field with white space
            data.correct = false;
            App.Player.updateMainGameScreen(data);
        }
    };

    var App = {
        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         */
        gameId: 0,

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /**
         * Player's name. Default is Anonymous.
         */
        myName: 'Anonymous',

        /**
         * Player number indicates which player is which. 
         * Host is player1, guest is player2.
         */
        playerNumber: 0,

        /**
         * Variable to keep track of which word 
         * the player is currently attempting to spell.
         */
        currentWord: 0,

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function() {
            App.cacheElements();
            App.bindEvents();
            App.displayHomeScreen();
        },

        /**
         * Cache templates.
         */
        cacheElements: function() {
            // Store game templates in App variables.
            App.$doc = $(document);
            App.$displayArea = $("#displayArea");
            App.$homeScreen = $("#homeScreen").html();
            App.$chooseGameScreen = $("#chooseGameScreen").html();
            App.$enterIdScreen = $("#enterIdScreen").html();
            App.$waitingScreen = $("#waitingScreen").html();
            App.$mainGameScreen = $("#mainGameScreen").html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function() {
            // Connection handlers
            App.$doc.on('click', '#btnSubmitName', App.Player.onPlayerSubmitName);
            App.$doc.on('click', '#btnCreateGame', App.Player.onPlayerCreateClick);
            App.$doc.on('click', '#btnJoinGame', App.Player.onPlayerJoinClick);
            App.$doc.on('click', '#btnSubmitId', App.Player.onPlayerSubmitIdClick);

            // Typing test handlers
            App.$doc.on('keyup', '#playerInput', function(e) {
                // Check if keypress was the spacebar
                if(e.keyCode === 32) {
                    App.Player.onSpacebarPress();
                }
            });
        },

        /* *************************************
         *       Screen Display Functions      *
         * *********************************** */

        /**
         * Display the "enter name screen" for TypeRace.
         */
        displayHomeScreen: function() {
            App.$displayArea.html(App.$homeScreen);
        },

        /**
         * Display the "choose game type screen" for TypeRace.
         */
        displayChoosegameScreen: function() {
            App.$displayArea.html(App.$chooseGameScreen);
        },

        /**
         * Display the "enter a gameId screen" for TypeRace.
         */
        displayEnterIdScreen: function() {
            App.$displayArea.html(App.$enterIdScreen);
        },

        /**
         * Dispaly "the waiting room screen" with a unique ID while the
         * host is waiting for a challenger.
         */
        displayWaitingScreen: function() {
            App.$displayArea.html(App.$waitingScreen);
            $("#gameId-display").text(App.gameId);
        },

        /**
         * Display the main game screen where the two players will TypeRace.
         */
        displayMainGameScreen: function(data) {
            App.$displayArea.html(App.$mainGameScreen);
            $(".game-text").html(data.typingTest);
            $("#player1Name").text(data.player1Name);
            $("#player2Name").text(data.player2Name);
        },

        /* *************************************
         *           Player Functions          *
         * *********************************** */

        Player: {
            onPlayerSubmitName: function() {
                App.myName = $("#inputEnterName").val();
                App.displayChoosegameScreen();
            },

            onPlayerCreateClick: function() {
                IO.socket.emit('joinNewGame', App.myName);
            },

            onPlayerJoinClick: function() {
                App.displayEnterIdScreen();
            },

            onPlayerSubmitIdClick: function() {
                // Assign gameId.
                App.gameId = +($("#inputSubmitId").val());
                App.playerNumber = 2;

                // Prepare data object for server.
                var data = {
                    gameId: App.gameId,
                    name: App.myName,
                    playerNumber: App.playerNumber
                };

                // Emit that player joined a room.
                IO.socket.emit('playerJoinGame', data);
            },

            onPlayerJoinedRoom: function(data) {
                // display waiting screen
                if( data.playerNumber === 1 ) {
                    App.gameId = data.gameId;
                    App.mySocketId = data.mySocketId;
                    App.displayWaitingScreen();
                }
                else {
                    App.displayMainGameScreen(data);
                }
                $('#' + App.currentWord).css("background-color", "gray");
            },

            onSpacebarPress: function() {
                // Prepare a data object to send to the server for checking        
                var data = {
                    gameId: App.gameId,
                    mySocketId: App.mySocketId,
                    input: $.trim($('#playerInput').val()),
                    currentWord: App.currentWord
                }

                // Check if player submitted actual text
                if( data.input != '' ) {
                    IO.socket.emit('playerSubmittedAnswer', data);
                }
                else {
                    // Submitted empty text, so remove all white space
                    $('#playerInput').val('');
                }
            },

            updateMainGameScreen: function(data) {
                if(data.mySocketId === App.mySocketId) {
                    if(data.correct) {
                        $('#player1GameText .word-' + App.currentWord).css("color", "green");

                    }
                    else {
                        $('#player1GameText .word-' + App.currentWord).css("color", "red");
                    }
                    $('#' + App.currentWord).css("background-color", "white");
                    // Update current word and remove all input in field.
                    App.currentWord++;
                    $('#playerInput').val('');
                    $('#' + App.currentWord).css("background-color", "gray");
                }
                else {
                    if(data.correct) {
                        $('#player2GameText .word-' + App.currentWord).css("color", "green");

                    }
                    else {
                        $('#player2GameText .word-' + App.currentWord).css("color", "red");
                    }
                }
            }
        }
    };

    IO.init();
    App.init();
}($));
