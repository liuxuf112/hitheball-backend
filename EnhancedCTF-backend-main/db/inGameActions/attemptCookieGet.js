
const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const getGameInfo = require("./getGameInfo");
const coordCalculations = require("../helpers/coordinateCalculations");
const attemptCookieGet = (httpRequest,httpResponse)=>{
    getGameInfo.checkIfDeviceMatchesGameID(httpRequest,httpResponse,tryToGetCookie,"attemptCookieGet")
}


async function tryToGetCookie(httpRequest,httpResponse,gameId,deviceId){
    //first we get all the cookies in the game.
    var cookieNumber = httpRequest.query.cookieNumber;
    if(!cookieNumber){
        console.error(`attempt get cookie called without flag number by device $deviceId`);
        httpResponse.status(400).send("Bad Request");
        return;
    }
    
    cookieNumber = Number(cookieNumber);
    
  

    //then do logical things

    var player;
    try{
        var res = await queries.getPlayerInfoFromDeviceId(deviceId);
        player = res.rows[0];
    }catch(err){
        errors.handleServerError("getPlayerInfoFromDeviceId",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }

    //next we need to make sure the cookie actually exists and is in the game, and isn't already held by a player

    var cookie
    try{
        console.log(cookieNumber)
        
        var res = await queries.getCookieFromGame(cookieNumber,gameId);
        var responseBody  = {}
        if(res.rows.length == 0){
            console.error("attempt get cookie called with cookie that is no longer available")
            responseBody.cookieGot = false;
            responseBody.reasonFailed = "Cookie is no longer available";
            httpResponse.status(200).send(JSON.stringify(responseBody));
            return;
        }else{
            cookie = res.rows[0];
        }
    }catch(err){
        errors.handleServerError("getCookieFromGame",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    //then we need to check if the cookie is close enough.
    //TODO: resolve race condition.
    var tagRadius = player.tag_radius;
    var cookieWithinRange = coordCalculations.checkIfPointsWithinDistance(cookie.cookie_location.x,cookie.cookie_location.y,player.player_location.x,player.player_location.y,tagRadius);
    if(!cookieWithinRange){
        responseBody.cookieGot = false;
        responseBody.reasonFailed = "Cookie is out of range.";
        httpResponse.status(200).send(JSON.stringify(responseBody));
        return;
    }else{
        //we update the cookie as got, and send back cookie got
        var activationLength;
        try{
            var res = await queries.updateCookieBelongsToPlayer(cookie.cookie_id,player.player_id);
            activationLength = res.rows[0].activation_length;
        }catch(err){
            errors.handleServerError("updateCookieBelongsToPlayer",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
        responseBody.gotCookie = true;
        responseBody.reasonFailed = "Did not fail"
        responseBody.secondsOfCookie = activationLength;
        responseBody.cookieType = cookie.cookie_type;
       
        httpResponse.send(JSON.stringify(responseBody));
    }
}




module.exports = {
    attemptCookieGet
}