
const errors = require("../helpers/Errors")
const queries = require("../helpers/Queries")



//tells you where a game is over.
//returns -1 on error 0 on false, 1 on true


async function setGameEnded(httpRequest,httpResponse,gameId){
    try{
   
        await queries.setGameEnded(gameId);
        return 0;
    }catch(err){
        errors.handleServerError("setGameEnded",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }

}
async function isGameOver(httpRequest,httpResponse,gameId){

    //the game is over if all of one team's flags are taken, or the timer is greater...
    //hard coded for 2 teams right now
    var teamOneFlagCount;
    try{
        var res = await queries.getFlagsLeft(1,gameId);
        teamOneFlagCount = res.rows[0].flag_count;
    }catch(err){
        errors.handleServerError("getflagsleft team 1, ", httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    try{
        var res = await queries.getFlagsLeft(2,gameId);
        teamTwoFlagCount = res.rows[0].flag_count;
    }catch(err){
        errors.handleServerError("getFlagsLeft team 2",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    if(teamOneFlagCount == 0 || teamTwoFlagCount == 0){
        var res = await setGameEnded(httpRequest,httpResponse,gameId);
       
        if(res != 0){
            return errors.ASYNC_FAILURE;
        }
        return true;
    }

    //otherwise we need to check the timing.

    var clockInfo;
    try{
        var res = await queries.getClockInfoAndNow(gameId);
        clockInfo = res.rows[0];
    }catch(err){
        errors.handleServerError("getGameInfo",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    var diffInSeconds = Math.floor((clockInfo.now - clockInfo.start_time_stamp)/1000);  //how long in seconds has passed since the time started.

    var gameSeconds = clockInfo.game_length * 60;

    if(diffInSeconds >= gameSeconds){    
        var res = await setGameEnded(httpRequest,httpResponse,gameId); //set the game ended if it isn't already.
        
        if(res != 0){
            return errors.ASYNC_FAILURE;
        }
        return true;
    }else{
        return false;
    }
}



module.exports = {
    isGameOver
}