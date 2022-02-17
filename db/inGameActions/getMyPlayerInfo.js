const getGameInfo = require('./getGameInfo')
const errors = require("../helpers/Errors")
const queries = require("../helpers/Queries")

const isGameOver = require('./isGameOver');
const classNames = require("../helpers/Classes").classNames;
const {
    cookie
} = require('express/lib/response');
const {
    VIEW_RADIUS_COOKIE_MUL,
    TAG_RADIUS_COOKIE_MUL,
    cookieTypesEnum
} = require('../helpers/CookieConstants');
const getMyPlayerInfo = (httpRequest, httpResponse) => {
    getGameInfo.checkIfDeviceMatchesGameID(httpRequest, httpResponse, sendMyPlayerInfo, "getMyPlayerInfo");
}
const TimeHelper = require('../helpers/TimeHelper');



//should send player username, location, tag radius, view radius, is eliminated, team id
//whether they have a flag, current game id, whatever.
async function sendMyPlayerInfo(httpRequest, httpResponse, gameId, deviceId) {
    var player;


    //getting the player info
    try {
        var res = await queries.getPlayerInfoFromDeviceId(deviceId);
        player = res.rows[0];
        if (player == null) {
            httpResponse.status(506).send("Player doesn't exist!");
            return;
        }
    } catch (err) {
        errors.handleServerError("getPlayerInfoFromDeviceId", httpResponse, err);
        return;
    }
    var playerFlag;

    //seeing if the player has a flag
    try {
        var res = await queries.getFlagNumberFromPlayerId(player.player_id);
        playerFlag = res.rows[0];
    } catch (err) {
        errors.handleServerError("getFlagNumberFromPLayerId", httpResponse, err);
        return;
    }

    var gameOver = await isGameOver.isGameOver(httpRequest, httpResponse, gameId);
    if (gameOver == errors.ASYNC_FAILURE) {
        return;
    }


    var sendBody = {};
    if (playerFlag && playerFlag.length != 0) {
        sendBody.hasFlag = true;
        sendBody.flagNumber = playerFlag.flag_number;
    } else {
        sendBody.hasFlag = false;
    }
    sendBody.gameOver = Boolean(gameOver);

    //setting all the info about the player
    sendBody.username = player.username;
    sendBody.location = {};
    if (player.player_location) {
        sendBody.location.latitude = player.player_location.x;
        sendBody.location.longitude = player.player_location.y;
    } else {
        sendBody.location = null;
    }

    //setting more info about the player

    //setting cookie buffs for sending your info


    sendBody.tagRadius = player.tag_radius ;
    sendBody.viewRadius = player.view_radius ;
    
    sendBody.eliminated = player.is_eliminated;
    sendBody.hasFlag = player.flag_id ? true : false; //says whether player has a flag or not.

    //next set the class info


    sendBody.gameId = gameId;
    httpResponse.status(200).send(JSON.stringify(sendBody));
}




module.exports = {
    getMyPlayerInfo
}