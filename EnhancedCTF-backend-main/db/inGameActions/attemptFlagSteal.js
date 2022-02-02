

const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const getGameInfo = require("./getGameInfo");
const coordCalculations = require("../helpers/coordinateCalculations");
const classesFile = require("../helpers/Classes");
//should be a get request, to attempt to steal flag.
const attemptStealFlag = (httpRequest,httpResponse)=>{
    getGameInfo.checkIfDeviceMatchesGameID(httpRequest,httpResponse,tryToStealFlag,"attempStealFlag")
}


//this function is called after we confirm the person attempting to steal the flag is in the right game.
async function tryToStealFlag(httpRequest,httpResponse,gameId,deviceId){
    var flagNumber = httpRequest.query.flagNumber;
    if(!flagNumber){
        console.error("attempt flag steal called without flag number");
        httpResponse.status(400).send("bad request");
        return;
    }

    //then do stupid logical things here.
    
    //first we should get player location and player info to figure out whether they're eliminated or not.
    //If they're eliminated they obviously can't steal a flag. 
    //also if they already have a flag... they can't steal a flag.
    var isPlayerInvisible = await isPlayerInvisible
    try{
        var res = await queries.getPlayerInfoFromDeviceId(deviceId);
        player = res.rows[0];
    }catch(err){
        errors.handleServerError("getPlayerInfoFromDeviceId",httpResponse,err);
        return;
    }
    var stealRadius =player.tag_radius;
    var playerLocation =player.player_location;
    var playerId =player.player_id;
    var teamId =player.team_id;
    var flag_id =player.flag_id;
    var isEliminated =player.is_eliminated;

    //if the player is a knight, they cannot steal flags.
    var classString = classesFile.classNames[player.class];
    if(classString === 'Knight'){
        console.error(`Player ${player.username} attempted to steal a flag while being a knight. Shame on them`);
        httpResponse.status(403).send("You cannot steal a flag while being a knight!");
        return;
    }else if(classString === "Queen"){  //if a player is a queen they cannot steal the flag that is their flag.
        var queenFlagNumber;
        try{
            var res = await queries.getQueenFlagNumber(player.player_id);
            queenFlagNumber = res.rows[0].flag_number;
        }catch(err){
            errors.handleServerError("getQueenFlagId",httpResponse,err);
            return;
        }
        if(queenFlagNumber == flagNumber){
            console.error(`Player ${player.usernamer} in game ${gameId} attempt to tag their own flag as a queen.`);
            httpResponse.status(403).send("You cannot grab the queen flag as a queen!");
            return;
        }
    
    }
  


    //can't get a flag if they have a flag or are eliminated.
    if(isEliminated){
        console.error("deviceID: " + deviceId + " attempted to steal flag number: " + flagNumber + " while eliminated");
        httpResponse.status(405).send("You cannot steal a flag when you are eliminated");
        return;
    }else if(flag_id){
        httpResponse.status(405).send("You are already holding a flag!");
        console.error("deviceID: " + deviceId + " attempted to steal flag number: " + flagNumber + " while holding another flag");
        return;
    }
    //then you need to find the location of the flag on the enemy team they're trying to steal.
    //might as well get flag_id here as well.
    var attemptStealFlag;
    try{
        var res = await queries.getFlagWithFlagNumber(teamId,flagNumber);
        if(res.rows.length == 0){
            httpResponse.status(405).send("This flag does not exist!");
            console.error("deviceID: " + deviceId + " attempted to steal flag number: " + flagNumber + " which does not exist");
            return;
        }else{
            attemptStealFlag = res.rows[0];
        }
    }catch(err){
        errors.handleServerError("getFlagWithFlagNumber",httpResponse,err);
        return;
    }

    var stealFlagLocation = attemptStealFlag.flag_location;
    //if the flag is within your steal radius... steal it!
    var returnBody = {};
    if(coordCalculations.checkIfPointsWithinDistance(stealFlagLocation.x,stealFlagLocation.y,playerLocation.x,playerLocation.y,stealRadius)){
        try{
            await queries.setFlagBelongsToPlayerId(attemptStealFlag.flag_id,playerId);
            returnBody.flagStolen = true;
            httpResponse.status(200).send(JSON.stringify(returnBody));
        }catch(err){
            errors.handleServerError("setFlagBelongsToPlayerID",httpResponse,err);
            return;
        }
    }else{
        returnBody.flagStolen = false;
        httpResponse.status(200).send(JSON.stringify(returnBody));
        console.error("deviceID: " + deviceId + " attempted to steal a flag outside of their flag radius, number: " + flagNumber);
    }
}

module.exports = {
    attemptStealFlag
}