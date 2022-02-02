const classesFile = require("../helpers/Classes");
const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const randoms = require("../helpers/randoms");
const classConstants = require("../helpers/ClassConstants");

//assigns the classes to players for the chess version of CTF
//returns -1 on failure, 0 on success.
async function assignChessClasses(httpRequest,httpResponse,gameInfo){
    

    //first way of doing it is just randomly assigning a class for each player.
    //first we get all players
    var players;
    try{
        var res = await queries.getUsersInGameId(gameInfo.game_id);
        players = res.rows;
    }catch(err){
        errors.handleServerError("getUsersInGameId",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }  

 
    for(player of players){
        var index = randoms.getRandomInt(0,classesFile.possibleChessClasses.length);
        var chessClass = classesFile.possibleChessClasses[index];
        
       
        //Assigning all the classes
        try{
            await queries.updatePlayerClass(player.player_id,chessClass);
        }catch(err){
            errors.handleServerError("updatePlayerClass",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
        //bishop and king are the only classes that have their view radiuses updated.
        var classString = classesFile.classNames[chessClass];
        if(classString === "Bishop" 
        || classString === "King"){
            var res = await updateViewAndTagRadius(httpRequest,httpResponse,player,classString,gameInfo)
            if(res==-1){
                return errors.ASYNC_FAILURE;
            }
        }else if(classString === "Queen"){
        
            //for the queen we need to connect it to a flag in the database
            var res = await assignQueenFlag(httpRequest,httpResponse,player,gameInfo);
            if(res==-1){
                return errors.ASYNC_FAILURE;
            }
        }
        //updating player view/tag radius if the class gets those.
    }
    return 0;
}

//updates view and tag radius for a class, returns 0 on success, -1 otherwise.
async function updateViewAndTagRadius(httpRequest,httpResponse,player,classString,gameInfo){
    //first we get default view and tag radius from game.
    var defaultTagRadius = gameInfo.default_tag_radius;
    var defaultViewRadius = gameInfo.default_view_radius;
    var newTagRadius = defaultTagRadius;
    var newViewRadius = defaultViewRadius;
    switch(classString){
        case "Bishop":
            newTagRadius *= classConstants.BISHOP_TAG_MULTIPLY;
            newViewRadius *= classConstants.BISHOP_VIEW_MULTIPLY;
            break;
        case "King":
            newTagRadius *= classConstants.KING_TAG_MULTIPLY;
            newViewRadius *= classConstants.KING_VIEW_MULTIPLY;
            break;
        default:
            console.error(`reached end of switch statement in updateViewAndTagRadius when assinging classes.. Game id: ${gameInfo.game_id}`);
            break;
    }

    try{
        await queries.updatePlayerViewAndTagRadius(player.player_id,newViewRadius,newTagRadius);
    }catch(err){
        errors.handleServerError("update player view and tag radius",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    return 0;
}

async function assignQueenFlag(httpRequest,httpResponse,player,gameInfo){
    var flags;
    
    try{
        var res = await queries.getEnemyFlagsFromTeamId(player.team_id);
        flags = res.rows;
    }catch(err){
        errors.handleServerError("getEnemyFlagsFromTeamId",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    //now we select a random flag 
    var flagChoice = randoms.getRandomInt(0,flags.length);
    var flagIdChosen = flags[flagChoice].flag_id;
    try{
        await queries.assignQueenFlag(player.player_id,flagIdChosen);
    }catch(err){
        errors.handleServerError("assignQueenFlag",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }

    return 0;
}



module.exports = {
    assignChessClasses
}