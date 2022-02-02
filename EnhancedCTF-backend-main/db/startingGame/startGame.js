const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const flags = require("./generateFlags");
const time = require("../creatingGame/gameTime");
const chessClasses = require("./assignChessClasses");
const generateCookies = require("./generateCookies");
//post body should have deviceID as well as gameID.

const startGame = async (httpRequest,httpResponse)=>{
    //first check if user who requested to start the game is the
    //user who created the game.
    var deviceId = httpRequest.body.deviceId;
    var gameId = httpRequest.body.gameId;
    if(deviceId == null || gameId == null){
        console.error(`USER with deviceId: ${deviceId} and gameId: ${gameId} submitted an invalid request to startGame`);
        httpResponse.status(400).send("Bad Request")
        return;
    }
    var userGame;
    try{
        var res = await queries.getGameIDUserCreated(deviceId);
        if(res.rows.length==0){ //user created 0 games
            console.error(`User with deviceId: ${deviceId} attempted to start a game but they don't have a game created`);
            httpResponse.status(400).send("Bad Request");
            return;

        }else if(res.rows.length >1){   //user created more than one game
            console.error(`User with deviceId: ${deviceId} has more than one game created. server error`);
            httpResponse.status(500).send("Internal Server Error");
            return;
        }
        userGame = res.rows[0];
    }catch(err){
        errors.handleServerError("getgameIDUserCreated",httpResponse,err);
    }

    //checking that the gameId's match up!
    
    if(userGame.game_id == gameId){
        attemptStartUserGame(httpRequest,httpResponse,gameId);
    }else{
        console.error(`User: ${deviceId} attempted to start a game they don't own!`);
        httpResponse.status(404).send("Not Found") //we don't want to tell a user the game exists
        return;
    }

}


//function to attempt to start a game that we already know that the user is in control over.

async function attemptStartUserGame(httpRequest,httpResponse,gameId){
    
    //first we need to check if the game isn't started yet. If the game isn't started we can start it!
    //At some point, we probably want to add a check for amount of players
    var gameInfo;
    try{
        var res = await queries.getGameInfo(gameId);
        if(res.rows[0].start_time != null){ //if it's not null then the game started already.
            console.error(`User attempted to start a game that already started!: ${gameId}`);
            httpResponse.status(400).send("You already started this game!");
            return;
        }else{
            gameInfo = res.rows[0];
        }
       
    }catch(err){
        errors.handleServerError("getGameInfo",httpResponse,err);
        return;
    }
    var res = 0;

    //first we generate the flags, if it's set to null or 0 we set it to 3
    if(gameInfo.flag_amount == null || gameInfo.flag_amount <= 0){
        gameInfo.flag_amount=3;
    }
    gameInfo.flag_amount = Math.floor(gameInfo.flag_amount);
    var result = await flags.generateFlagsForAllTeams(httpRequest,httpResponse,gameId,gameInfo.flag_amount);
    if(result == errors.ASYNC_FAILURE){ //if it failed
        return;
    }

  

    //then we generate cookies
    result = await generateCookies.generateCookiesForGame(httpRequest,httpResponse,gameId);
    if(result == errors.ASYNC_FAILURE){
        return;
    }

    //then we assign classes.
    switch(gameInfo.game_type){
        case 0:
            break;
        case 1:
            res = await chessClasses.assignChessClasses(httpRequest,httpResponse,gameInfo);
            if(res==errors.ASYNC_FAILURE){
                return;
            }
            break;
        default:
            console.error(`Invalid game type in gameInfo: ${gameInfo.game_type} for game ID : ${gameId}`);
            httpResponse.status(500).send("Internal Server Error");
            return;
    }



    //TODO: if this fails we should get rid of all flags. 
    result = await time.setGameStartTime(httpRequest,httpResponse,gameId);
    if(result < 0){ //if it failed
        return;
    }
    httpResponse.status(200).send("Game Started!");
    
}


module.exports = {
    startGame
}