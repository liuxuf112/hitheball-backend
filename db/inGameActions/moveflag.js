

const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const getGameInfo = require("./getGameInfo");
const coordCalculations = require("../helpers/coordinateCalculations");
const classesFile = require("../helpers/Classes");
//should be a get request, to attempt to steal flag.
const moveflag = (httpRequest,httpResponse)=>{
    getGameInfo.checkIfDeviceMatchesGameID(httpRequest,httpResponse,trytomoveflag,"moveflag")
}


//this function is called after we confirm the person attempting to steal the flag is in the right game.
async function trytomoveflag(httpRequest,httpResponse,gameId,deviceId){
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

    var attemptStealFlag;
    try{
        var res = await queries.getFlagWithFlagNumber(teamId,flagNumber);
        attemptStealFlag = res.rows[0];
    }catch(err){
        errors.handleServerError("getFlagWithFlagNumber",httpResponse,err);
        return;
    }

    var stealFlagLocation = attemptStealFlag.flag_location;
    var tempX = stealFlagLocation.x;
    var tempY = stealFlagLocation.y;

    print(tempX);
    print(tempY);

    n_tempX = tempX + 1.;
    n_tempY = tempY + 1.;

    print(n_tempX);
    print(n_tempY);

    try{
        await queries.setflaglocation(n_tempY, n_tempY, attemptStealFlag.flag_id);
        
    }catch(err){
        errors.handleServerError("moveflagError",httpResponse,err);
        return;
    }
    

}

module.exports = {
    moveflag
}