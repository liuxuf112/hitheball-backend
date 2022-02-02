const queries = require('../helpers/Queries');

const errors = require('../helpers/Errors');

const regionCalcs = require("../helpers/regionCalculations");
const gameInfo = require('./getGameInfo');
const coordCalcs = require("../helpers/coordinateCalculations");

//returns true if a player is in their team zone, returns false if they are not
//returns -1 on error


const attemptBackInHomeBase = async (httpRequest,httpResponse)=>{
    gameInfo.checkIfDeviceMatchesGameID(httpRequest,httpResponse,actuallyAttemptBackInHomeBase,"getEnemiesInViewRadius")
    
}

async function actuallyAttemptBackInHomeBase(httpRequest,httpResponse,gameId,deviceId) {
    
    var player;
    try{
        var res = await queries.getPlayerInfoFromDeviceId(deviceId);
        player = res.rows[0];
    }catch(err){
        errors.handleServerError("getPlayerInfoFromDeviceId",httpResponse,err);
    }
    var newPlayerEliminatedStatus = player.is_eliminated;
    var newPlayerFlagStatus = player.flag_id;
    var playerSafe = await isPlayerInHomeZone(httpRequest,httpResponse,player,player.player_location.x,player.player_location.y);
    
    if(playerSafe==-1){
        return;
    }else{
        if(playerSafe==true){  //if the 
            if(player.flag_id){
                try{
                    
                   await queries.removeFlagFromGame(player.flag_id);
               
                }catch(err){
                    errors.handleServerError("removeFlagFromGame",httpResponse,err);
                    return;
                }
      
                var res = await checkIfFlagRemovedWasQueenFlag(httpRequest,httpResponse,player.flag_id,player.team_id);
                if(res==-1){
                    return;
                }
           
            }
           
            newPlayerEliminatedStatus = false;
            newPlayerFlagStatus = null;
        }
    }
    queries.updateEliminatedAndFlagStatus(player.player_id,newPlayerEliminatedStatus,newPlayerFlagStatus);

    sendBody = {};
    sendBody.backInHome = playerSafe;  
    httpResponse.status(200).send(JSON.stringify(sendBody));
}



async function isPlayerInHomeZone(httpRequest,httpResponse,player,newLatitude,newLongitude){
    var teamRegion;
    try{
        //get the team region.
        var res = await queries.getRegionOfTeam(player.team_id);
        teamRegion = res.rows[0];
    }catch(err){
        errors.handleServerError("getRegionOfTeam",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    var latLongRegion = regionCalcs.convertXYRegiontoLatLon(teamRegion);
    return coordCalcs.queryIfPointInRectangle({latitude:newLatitude,longitude:newLongitude},latLongRegion);
    

    //we know the player is dead, so all we need to do is check if their new position is alive.
}

async function isPlayerInGameRegion(httpRequest,httpResponse,player,newLatitude,newLongtiude){
    var gameRegion;
    try{
        var res = await queries.getGameRegionFromTeamId(player.team_id);
        gameRegion = res.rows[0];
    }catch(err){
        errors.handleServerError("getGameRegionFromTeamId",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    var latLongRegion = regionCalcs.convertXYRegiontoLatLon(gameRegion);
    return coordCalcs.queryIfPointInRectangle({latitude:newLatitude,longitude:newLongtiude},latLongRegion);
}


//note that team Id is the id of the team that is REMOVING the flag, so the opposite team as 
//the team that owns flagId. 
//if the flag removed was a queen flag, we should update that queen to see a different flag on the enemy team
async function checkIfFlagRemovedWasQueenFlag(httpRequest,httpResponse,flagId,teamId){
  
    var queens;
    try{
        var res = await queries.getQueenInfoFromFlagId(flagId);
        queens = res.rows;
    }catch(err){
        errors.handleServerError("getQueenInfoFromFlagId",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }


    //if no queens have that flag, return.
    if(queens.length == 0){
        return 0;
    }

    //otherwise get all the flags in the game belonging to the teamID opposite to teamId
    var flagsToSwitchTo;

    try{
        var res =  await queries.getAllEnemyFlagsStillInGame(teamId);
         flagsToSwitchTo = res.rows;
    }catch(err){
        errors.handleServerError("getAllEnemyFlagsStillinGame",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    for(queen of queens){
        if(flagsToSwitchTo.length == 0){
            break;   //the game is over
        }
        var flagChoice = randoms.getRandomInt(0,flagsToSwitchTo.length);
        try{
            await queries.assignQueenFlag(queen.player_id,flagsToSwitchTo[flagChoice].flag_id);

        }catch(err){
            errors.handleServerError("assignQueenFlag",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
    }
    return 0;

}


module.exports = {
    attemptBackInHomeBase
}