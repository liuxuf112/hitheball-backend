//this file serves to collect all the exports from other files and make it the exports for one file
//so server.js just needs this one file to work.

const gameInfo = require("./inGameActions/getGameInfo")
const createGameFile = require("./creatingGame/CreateInitialGame")
const myPlayerInfo = require("./inGameActions/getMyPlayerInfo");
const stealFlag = require("./inGameActions/attemptFlagSteal");

const moveflag = require("./inGameActions/moveflag");

const tagPlayer = require("./inGameActions/attemptPlayerTag");
const startGame = require("./startingGame/startGame");
const endGame = require("./endingGame/endGame");
const updateGameInfo = require("./creatingGame/updateGameInfo");
const player = require("./creatingGame/addPlayer");
const deleteGame = require("./endingGame/deleteGame");
const playerLocations = require("./inGameActions/playerLocation");
const coins = require('./creatingGame/generateCoins');
const gameCoins = require('./inGameActions/gameCoins');
const cookieGet = require('./inGameActions/attemptCookieGet');
const attemptBackHome = require('./inGameActions/attemptBackInHomeBase');
module.exports = {
    createGame:createGameFile.createGame,

    getPlayersInGame: gameInfo.getAllPlayersInGame,
    getTeamsInfoForGame: gameInfo.getTeamsInfoForGame,
    getTeammatesLocations: gameInfo.getTeammatesLocations,
    getEnemiesInViewRadius: gameInfo.getEnemiesInViewRadius,
    getMyTeamsFlags: gameInfo.getMyTeamsFlags,
    getGameRegions: gameInfo.getGameRegions,
    getClockInfo: gameInfo.getClockInfo,
    //getMapScreenInfo: gameInfo.getMapScreenInfo,
    getEnemyFlags: gameInfo.getEnemyFlags,
    getGameStarted: gameInfo.getGameStarted,
    setGameInfo: updateGameInfo.setGameInfo,

    getMyInfo: myPlayerInfo.getMyPlayerInfo,

    attemptStealFlag: stealFlag.attemptStealFlag,

    moveflag: moveflag.moveflag,

    attemptTagPlayer: tagPlayer.attemptTagPlayer,

    getEndGameInfo: endGame.tryToGetEndGameInfo,

    startGame: startGame.startGame,

    joinGame: player.joinGame,

    deleteGame: deleteGame.tryDeletingGame,
    deleteMyGames: deleteGame.tryDeletingGameNoGameId,

    updatePlayerLocation: playerLocations.updatePlayerLocation,

    generateCoinForGame: coins.generateCoinForGame,
    getCoinsFromGame: coins.getCoinsFromGame,
    playerGetGameCoin: gameCoins.playerGetGameCoin,
    attemptCookieGet: cookieGet.attemptCookieGet,
    attemptBackHome: attemptBackHome.attemptBackInHomeBase


}
