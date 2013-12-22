/*
 * Code for all server logic contained in battlegame.js
 */
var io;
var gameSocket;
var player1Name = '';
var player2Name = '';

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Player Events
    gameSocket.on('joinNewGame', joinNewGame);
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerSubmittedAnswer', playerSubmittedAnswer);
};

/*
 * A player is creating a new game with a unique room ID
 */
function joinNewGame(name) {
    // Save player name to the server.
    player1Name = name;

    // Create a unique Socket.IO Room.
    var thisGameId = ( Math.random() * 100000 ) | 0;

    // Join the room.
    this.join(thisGameId.toString());

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('playerJoinedRoom', {
        gameId: thisGameId,
        mySocketId: this.id,
        playerNumber: 1
    });
};

function playerJoinGame(data) {
    // Save a player name to the server.
    player2Name = data.name;

    // A reference to the player's Socket.IO socket object
    var sock = this;

    console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // attach the typing test, since the game is about to start
        typingTest = createTypingTest();
        data.typingTest = typingTest;

        // Join the room
        sock.join(data.gameId);

        // Attach player names to data object.
        data.player1Name = player1Name;
        data.player2Name = player2Name;

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    }
    else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
};

function playerSubmittedAnswer(data) {
    // Check if player's answer is correct.
    if( wordPool[data.currentWord] === data.input ) {

        // Update the player's game state.
        io.sockets.in(data.gameId).emit('playerAnsweredCorrectly', data)
        console.log("Correct answer, " + wordPool[data.currentWord] + "===" + data.input);

        // Check if player is done.
        if( data.currentWord === (wordPool.length - 1) ) {
            this.emit('playerFinished', data);
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
    'do',
    'at',
    'by',
    'we',
    'of',
    'an',
    'my',
    'so',
    'up',
    'to',
    'go',
    'me',
    'no',
    'be',
    'us',
    'us',
    'the',
    'one',
    'all',
    'big',
    'let',
    'but',
    'his',
    'out',
    'and',
    'why',
    'who',
    'get',
    'for',
    'say',
    'can',
    'her',
    'him',
    'old',
    'see',
    'put',
    'now',
    'its',
    'she',
    'own',
    'use',
    'two',
    'how',
    'our',
    'way',
    'new',
    'any',
    'day',
    'you',
    'any',
    'too',
    'not',
    'ask',
    'may',
    'try',
    'good',
    'some',
    'will',
    'them',
    'they',
    'that',
    'than',
    'then',
    'this',
    'look',
    'only',
    'come',
    'have',
    'keep',
    'same',
    'also',
    'back',
    'much',
    'over',
    'when',
    'make',
    'what',
    'work',
    'most',
    'well',
    'like',
    'even',
    'time',
    'want',
    'high',
    'with',
    'feel',
    'give',
    'just',
    'most',
    'from',
    'very',
    'even',
    'back',
    'know',
    'good',
    'take',
    'need',
    'mean',
    'life',
    'into',
    'work',
    'down',
    'year',
    'last',
    'your',
    'call',
    'over',
    'first',
    'world',
    'still',
    'would',
    'after',
    'child',
    'there',
    'woman',
    'these',
    'three',
    'state',
    'never',
    'great',
    'their',
    'about',
    'which',
    'while',
    'could',
    'other',
    'after',
    'leave',
    'think',
    'family',
    'school',
    'should',
    'people',
    'really',
    'become',
    'another',
    'because',
    'between',
    'problem',
    'through',
    'student',
    'something'
];