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
    var cookieRes = await getActiveCookiesOnPlayer(httpRequest, httpResponse, player.player_id);
    if (cookieRes == errors.ASYNC_FAILURE) {
        return errors.ASYNC_FAILURE;
    }
    var viewMul = 1.0;
    var tagMul = 1.0;
    var invisible = false;

    //setting cookie buffs for sending your info
    for (const cookie of cookieRes) {
        switch (cookie.type) {
            case cookieTypesEnum.VIEW_RADIUS_COOKIE_TYPE:
                viewMul *= VIEW_RADIUS_COOKIE_MUL;
                break;
            case cookieTypesEnum.TAG_RADIUS_COOKIE_TYPE:
                tagMul *= TAG_RADIUS_COOKIE_MUL;
                break;
            case cookieTypesEnum.INVISIBLE_COOKIE_TYPE:
                invisible = true;
                break;
            default:
                console.error(`unknown cookie, type: ${cookie.cookieType}`)
                break;
        }
    }



    sendBody.activeCookies = cookieRes;
    sendBody.tagRadius = player.tag_radius * tagMul;
    sendBody.viewRadius = player.view_radius * viewMul;
    sendBody.invisible = invisible;
    sendBody.eliminated = player.is_eliminated;
    sendBody.hasFlag = player.flag_id ? true : false; //says whether player has a flag or not.

    //next set the class info
    sendBody.classString = classNames[player.class];
    sendBody.classId = player.class;


    if (classNames[player.class] === "Queen") {

        try {
            var res = await queries.getQueenFlagNumber(player.player_id);
            sendBody.queenFlagNumber = res.rows[0].flag_number;
        } catch (err) {
            errors.handleServerError("getQueenFlagNumber", httpResponse, err);
            return;
        }
    } else {
        sendBody.queenFlagNumber = -1;
    }


    sendBody.gameId = gameId;
    httpResponse.status(200).send(JSON.stringify(sendBody));
}


async function getActiveCookiesOnPlayer(httpRequest, httpResponse, playerId) {

    var cookies;

    try {
        var res = await queries.getAllCookiesOnPlayer(playerId);
        cookies = res.rows;
    } catch (err) {
        errors.handleServerError("getAllCookiesOnPlayer", httpResponse, err);
    }

    var activeCookiesSendBody = [];
    for (const cookie of cookies) {

        var secondsDifference = TimeHelper.howLongAgoWas(cookie.activation_time_stamp);

        if (secondsDifference < cookie.activation_length) { //if the amount of seconds expired is less.
            var secondsLeft = cookie.activation_length - secondsDifference;
        } else {
            continue;
        }
        var cookieSend = {};
        cookieSend.secondsLeft = Math.floor(secondsLeft);
        cookieSend.type = cookie.cookie_type;
        cookieSendcookieNumber = cookie.cookie_number;
        activeCookiesSendBody.push(cookieSend);
    }
    return activeCookiesSendBody;


}

module.exports = {
    getMyPlayerInfo
}