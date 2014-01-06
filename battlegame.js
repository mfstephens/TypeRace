/*
 * Code for all server logic contained in battlegame.js
 */
var io,
    gameSocket,
    hostName,
    guestName;

var existingGames = [];

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket) {
    io = sio;
    gameSocket = socket;
    gameSocket.emit('playerConnected');

    // Player Events
    gameSocket.on('joinNewGame', joinNewGame);
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerSubmittedAnswer', playerSubmittedAnswer);
    gameSocket.on('gameScreenReady', startCountdown);
};

/*
 * A player is creating and joining a new game with a unique roomId.
 */
function joinNewGame(name) {
    // Save player name to the server.
    hostName = name;

    // Create a unique Socket.IO Room.
    var thisGameId = ( Math.random() * 100000 ) | 0;
    for(var i = 0; i < existingGames.length; ++i) {
        if(existingGames[i].gameId === thisGameId) {
            thisGameId = ( Math.random() * 100000 ) | 0;
            i = 0;
        }
    }

    // Add game to existing games
    existingGames.push({
        gameId: thisGameId,
        numberOfPlayers: 1
    });

    console.log('Player ' + name + ' creating room: ' + thisGameId);

    // Join the room.
    this.join(thisGameId.toString());
    console.log('Player ' + this.id + ' joining game: ' + thisGameId);

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('playerCreatedNewRoom', {
        gameId: thisGameId,
        mySocketId: this.id
    });
};

function isRoomAvailable(gameId) {
    for(var i = 0; i < existingGames.length; ++i) {
        if(existingGames[i].gameId === gameId && existingGames[i].numberOfPlayers < 2) {
            existingGames[i].numberOfPlayers++;
            return true
        }
    }
    return false;
};

function playerJoinGame(data) {
    // Save a player name to the server.
    guestName = data.guestName;

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    // If the room exists and is not full, join the room
    if( room != undefined || isRoomAvailable(data.gameId)){
        // Attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Attach the typing test to the data object.
        typingTest = createTypingTest();
        data.typingTest = typingTest;

        // Join the room
        sock.join(data.gameId);
        console.log('Player ' + data.name + ' joining game: ' + room);

        // Attach player names to data object.
        data.hostName = hostName;
        data.guestName = guestName;

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    }
    else {
        // Otherwise, send an error message back to the player.
        this.emit('error', {message: "This room does not exist or is full."});
    }
};

function startCountdown(gameId) {
    var counter = 3;

    // Start a countdown
    setInterval(function() {
        counter--;
        if(counter < 1) {
            // Send signal to begin game
            io.sockets.in(gameId).emit('startGame');
        }
        else {
            // Send signal to update gameclock
            io.sockets.in(gameId).emit('updateGameCountdown', counter.toString());
        }
    }, 1000);
};

function playerSubmittedAnswer(data) {
    // Check if player's answer is correct.
    if( wordPool[data.currentWord] === data.input ) {

        // Update the player's game state.
        io.sockets.in(data.gameId).emit('playerAnsweredCorrectly', data)
        console.log("Correct answer, " + wordPool[data.currentWord] + "===" + data.input);

        // Check if player is done.
        if( data.currentWord === (wordPool.length - 1) ) {
            var newData = {
                gameWinnerId: data.mySocketId,
                gameWinnerName: data.myName
            };

            io.sockets.in(data.gameId).emit('gameOver', newData);
        }
    }
    else {
        io.sockets.in(data.gameId).emit('playerAnsweredIncorrectly', data)
        console.log("Incorrect answer, " + wordPool[data.currentWord] + "!=" + data.input);
    }
}

function createTypingTest() {
    var m = wordPool.length, t, i;

    // Shuffle array to create a unique test
    while(m) {

        // Pick a remaining element
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element
        t = wordPool[m];
        wordPool[m] = wordPool[i];
        wordPool[i] = t;
    }

    var typingTest = '';
    for(var i = 0; i < wordPool.length; ++i) {
        typingTest += "<span class='word word-" + i + "'>" + wordPool[i] + "</span>";
    }

    return typingTest;
};

/*
 *  This wordPool will act as the supplier of typing text
 */
var wordPool = [
    'or',
    'if',
    'in',
    'it',
    'on',
    'he',
    'as',
    'do'
    // 'at',
    // 'by',
    // 'we',
    // 'of',
    // 'an',
    // 'my',
    // 'so',
    // 'up',
    // 'to',
    // 'go',
    // 'me',
    // 'no',
    // 'be',
    // 'us',
    // 'us',
    // 'the',
    // 'one',
    // 'all',
    // 'big',
    // 'let',
    // 'but',
    // 'his',
    // 'out',
    // 'and',
    // 'why',
    // 'who',
    // 'get',
    // 'for',
    // 'say',
    // 'can',
    // 'her',
    // 'him',
    // 'old',
    // 'see',
    // 'put',
    // 'now',
    // 'its',
    // 'she',
    // 'own',
    // 'use',
    // 'two',
    // 'how',
    // 'our',
    // 'way',
    // 'new',
    // 'any',
    // 'day',
    // 'you',
    // 'any',
    // 'too',
    // 'not',
    // 'ask',
    // 'may',
    // 'try',
    // 'good',
    // 'some',
    // 'will',
    // 'them',
    // 'they',
    // 'that',
    // 'than',
    // 'then',
    // 'this',
    // 'look',
    // 'only',
    // 'come',
    // 'have',
    // 'keep',
    // 'same',
    // 'also',
    // 'back',
    // 'much',
    // 'over',
    // 'when',
    // 'make',
    // 'what',
    // 'work',
    // 'most',
    // 'well',
    // 'like',
    // 'even',
    // 'time',
    // 'want',
    // 'high',
    // 'with',
    // 'feel',
    // 'give',
    // 'just',
    // 'most',
    // 'from',
    // 'very',
    // 'even',
    // 'back',
    // 'know',
    // 'good',
    // 'take',
    // 'need',
    // 'mean',
    // 'life',
    // 'into',
    // 'work',
    // 'down',
    // 'year',
    // 'last',
    // 'your',
    // 'call',
    // 'over',
    // 'first',
    // 'world',
    // 'still',
    // 'would',
    // 'after',
    // 'child',
    // 'there',
    // 'woman',
    // 'these',
    // 'three',
    // 'state',
    // 'never',
    // 'great',
    // 'their',
    // 'about',
    // 'which',
    // 'while',
    // 'could',
    // 'other',
    // 'after',
    // 'leave',
    // 'think',
    // 'family',
    // 'school',
    // 'should',
    // 'people',
    // 'really',
    // 'become',
    // 'another',
    // 'because',
    // 'between',
    // 'problem',
    // 'through',
    // 'student',
    // 'something'
];