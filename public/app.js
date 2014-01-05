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
            IO.socket.on('playerConnected', IO.onPlayerConnected);
            IO.socket.on('playerCreatedNewRoom', IO.onPlayerCreatedNewRoom);
            IO.socket.on('playerJoinedRoom', IO.onPlayerJoinedRoom);
            IO.socket.on('playerAnsweredCorrectly', IO.onPlayerAnsweredCorrectly);
            IO.socket.on('playerAnsweredIncorrectly', IO.onPlayerAnsweredIncorrectly);
            IO.socket.on('updateGameCountdown', IO.onUpdateGameCountdown);
            IO.socket.on('startGame', IO.onStartGame);
            IO.socket.on('gameOver', IO.onGameOver);
        },

        /**
         * The client is successfully connected!
         */
        onPlayerConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
        },

        /**
         * Player has created a new room.
         */
        onPlayerCreatedNewRoom: function(data) {
            App.Player.onPlayerCreatedNewRoom(data);
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
        },

        onUpdateGameCountdown: function(time) {
            App.updateGameCountdown(time);
        },

        onStartGame: function() {
            App.startGame();
        },

        onGameOver: function(data) {
            App.endGame(data);
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
        myName: '',

        /**
         * Player's role to help distinguish names.
         */
        myRole: '',

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
        },

        /**
         * Cache main game screen.
         */
        cacheElements: function() {
            // Store game templates in App variables.
            App.$doc = $(document);
            App.$container = $("#container");
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
            App.$doc.on('keypress', '#playerInput', function(e) {
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
         * Display the "choose game type screen" for TypeRace.
         */
        displayChoosegameScreen: function() {
            $("#homeScreen").animate({
                left: '-50%'
            }, 500, function() {
                $(this).css('left', '150%');
                $(this).appendTo('#container');
            });

            $("#chooseGameScreen").animate({
                left: '50%'
            }, 500);
        },

        /**
         * Display the "enter a gameId screen" for TypeRace.
         */
        displayEnterIdScreen: function() {
            $("#chooseGameScreen").animate({
                left: '-50%'
            }, 500, function() {
                $(this).css('left', '150%');
                $(this).appendTo('#container');
            });

            $("#enterIdScreen").animate({
                left: '50%'
            }, 500);
        },

        /**
         * Dispaly "the waiting room screen" with a unique ID while the
         * host is waiting for a challenger.
         */
        displayWaitingScreen: function() {
            $("#gameId-display").text(App.gameId);
            $("#chooseGameScreen").animate({
                left: '-50%'
            }, 500, function() {
                $(this).css('left', '150%');
                $(this).appendTo('#container');
            });

            $("#waitingScreen").animate({
                left: '50%'
            }, 500);
        },

        /**
         * Display the main game screen where the two players will TypeRace.
         */
        displayMainGameScreen: function(data) {
            App.$container.html(App.$mainGameScreen);
            $(".game-text").html(data.typingTest);
            if(App.myRole === "host") {
                $("#player1Name").text(data.hostName);
                $("#player2Name").text(data.name);
            }
            else {
                $("#player1Name").text(data.name);
                $("#player2Name").text(data.hostName);
            }

            // Tell the server the game is ready.
            IO.socket.emit("gameScreenReady", App.gameId);
        },

        updateGameCountdown: function(time) {
            $("#countdown").html(time);
        },

        startGame: function() {
            // Set timer to say Go
            $("#countdown").html("Go!");

            // Enable player input for the game to begin
            $("#playerInput").prop('disabled', false);

            // Set timer to say Go
            $("#playerInput").focus();

            // Highlight the first word in the player text
            $('#player1GameText .word-' + App.currentWord).css("background-color", "#dddddd");
        },

        endGame: function(data) {
            console.log("winnder: " + data.gameWinnerId);
            if(data.gameWinnerId === App.mySocketId) {
                $("#container").append('<div id="gameOverScreen">You Win!</div>');
            }
            else {
                $("#container").append('<div id="gameOverScreen">You Lose!</div>');
            }
        },

        /* *************************************
         *           Player Functions          *
         * *********************************** */

        Player: {
            onPlayerSubmitName: function() {
                var name = $("#inputEnterName").val();
                if(name === "") {
                    App.myName = "Anonymous";
                }
                else {
                    App.myName = name;
                }
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

                // Prepare data object for server.
                var data = {
                    gameId: App.gameId,
                    name: App.myName
                };

                // Emit that player joined a room.
                IO.socket.emit('playerJoinGame', data);
            },

            onPlayerCreatedNewRoom: function(data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = "host";
                App.displayWaitingScreen();
            },

            onPlayerJoinedRoom: function(data) {
                if(App.mySocketId === '') {
                    App.mySocketId = data.mySocketId;
                    App.myRole = "guest";
                    App.gameId = data.gameId;
                }

                // Show the main game screen
                App.displayMainGameScreen(data);
            },

            onSpacebarPress: function() {
                var input = $.trim($('#playerInput').val());
                // Prepare a data object to send to the server for checking        
                var data = {
                    gameId: App.gameId,
                    mySocketId: App.mySocketId,
                    input: input,
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
                        $('#player1GameText .word-' + data.currentWord).css("color", "green");
                    }
                    else {
                        $('#player1GameText .word-' + data.currentWord).css("color", "red");
                    }
                    $('#player1GameText .word-' + App.currentWord).css("background-color", "transparent");
                    // Update current word and remove all input in field.
                    App.currentWord++;
                    $('#playerInput').val('');
                    $('#player1GameText .word-' + App.currentWord).css("background-color", "#dddddd");
                }
                else {
                    if(data.correct) {
                        $('#player2GameText .word-' + data.currentWord).css("color", "green");

                    }
                    else {
                        $('#player2GameText .word-' + data.currentWord).css("color", "red");
                    }
                }
            }
        }
    };

    IO.init();
    App.init();
}($));
