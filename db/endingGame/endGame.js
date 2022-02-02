const getGameInfo = require("../inGameActions/getGameInfo");
const errors = require("../helpers/Errors")
const queries = require("../helpers/Queries")


const tryToGetEndGameInfo = (httpRequest,httpResponse) =>{
    getGameInfo.checkIfDeviceMatchesGameID(httpRequest,httpResponse,getEndGameInformation,"tryToGetEndGameInfo");
}

async function getEndGameInformation(httpRequest,httpResponse,gameId,deviceId){
    var gameInfo;
    var sendBody = {};
    try{
        var res = await queries.getGameInfo(gameId);
        gameInfo = res.rows[0];
    }catch(err){
        errors.handleServerError("getGameInfo",httpResponse,err);
        return;
    }

    if(gameInfo.end_time_stamp == null){
        
        httpResponse.status(403).send("This game hasn't ended yet!");
        console.error(`Device: ${deviceId} attempted to get end game info for a game that hadn't ended yet: ${gameId}`)
        return;
    }
    sendBody.startTimeStamp = gameInfo.start_time_stamp;
  
    var difference = gameInfo.end_time_stamp - gameInfo.start_time_stamp;
    
    var daysDifference = Math.floor(difference/1000/60/60/24);
    difference -= daysDifference*1000*60*60*24

    var hoursDifference = Math.floor(difference/1000/60/60);
    difference -= hoursDifference*1000*60*60

    var minutesDifference = Math.floor(difference/1000/60);
    difference -= minutesDifference*1000*60

    var secondsDifference = Math.floor(difference/1000);
   
    sendBody.gameDayLength = daysDifference;
    sendBody.gameHourLength = hoursDifference;
    sendBody.gameMinuteLength = minutesDifference;
    sendBody.gameSecondLength = secondsDifference;


    var teamOneFlagsLeft;
    var teamTwoFlagsLeft;

    try{
        var res = await queries.getFlagsLeft(1,gameId);
        teamOneFlagsLeft = res.rows[0].flag_count;
    }catch(err){
        errors.handleServerError("getFlagsleft",httpResponse,err);
        return;
    }

    try{
        var res = await queries.getFlagsLeft(2,gameId);
        teamTwoFlagsLeft = res.rows[0].flag_count;
    }catch(err){
        errors.handleServerError("getFlagsleft",httpResponse,err);
        return;
    }

    var result;  //result of 0 in winner means tie, anything else means that team one.
    if(teamTwoFlagsLeft == teamOneFlagsLeft){
        result = 0 ;
    }else if(teamTwoFlagsLeft > teamOneFlagsLeft){
        result = 2;
    }else{
        result = 1;
    }
    
    sendBody.winner = result;
    sendBody.teamOneFlagsLeft = teamOneFlagsLeft;
    sendBody.teamTwoFlagsLeft = teamTwoFlagsLeft;  
    httpResponse.status(200).send(JSON.stringify(sendBody))


}

module.exports = {
    tryToGetEndGameInfo
}