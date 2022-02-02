const queries = require("../helpers/Queries");

const errors = require("../helpers/Errors")
//this function will be called whenever the game updates the game info,
//from updateGameInfo
//so the first thing it should do is check whether the teams already exist.
const TEAMONENUMBER = 1
const TEAMTWONUMBER = 2
const TEAMONECOLOR = "FF0000FF";
const TEAMTWOCOLOR = "0000FFFF";

function getTeamIds(resultRows){
    teamIds = {}
    var teamOneId = 0;
    var teamTwoId = 1;
    for(var i = 0; i < resultRows.length; i++){
        if(resultRows[i].team_number == TEAMONENUMBER){
            teamOneId = resultRows[i].team_id;
        }else if(resultRows[i].team_number == TEAMTWONUMBER){
            teamTwoId = resultRows[i].team_id;
        }
    }
    teamIds["teamOneId"] = teamOneId
    teamIds["teamTwoId"] = teamTwoId
    return teamIds
}


async function tryCreatingTeams(httpRequest,httpResponse,gameId){
    var teams;
    var teamOneId,teamTwoId;
    try{
        var res = await queries.getTeamsWithGameId(gameId);
        teams = res.rows;
    }catch(err){
        errors.handleServerError("getTeamsWithTeamId",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    if(teams.length == 2){
        var teamIds = getTeamIds(teams);
        teamOneId = teamIds.teamOneId;
        teamTwoId = teamIds.teamTwoId;

    }else{ //the teams don't exist yet for this game.
       
        try{    //create team one
            var res = await queries.createTeam(gameId,TEAMONENUMBER,TEAMONECOLOR,null);
            teamOneId = res.rows[0].team_id;
        }catch(err){
            errors.handleServerError("createTeam, team1",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
        
        try{
            var res = await queries.createTeam(gameId,TEAMTWONUMBER,TEAMTWOCOLOR,teamOneId);
            teamTwoId = res.rows[0].team_id;
        }catch(err){
            errors.handleServerError("createTeam, team2",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
        try{
            await queries.updateEnemyTeamId(teamOneId,teamTwoId);
        }catch(err){
            errors.handleServerError("Update Enemy Team ID team 2",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
       

    }
    return {"teamOneId":teamOneId,"teamTwoId":teamTwoId}
   

}




module.exports={
    tryCreatingTeams,
    getTeamIds
}