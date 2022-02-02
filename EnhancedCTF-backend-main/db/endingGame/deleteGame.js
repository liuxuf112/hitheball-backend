const errors = require("../helpers/Errors")
const queries = require("../helpers/Queries")




//body to post request looks like this:
/*

{
    gameId: FDDSDF
    deviceId: deleteDevicId
}

*/
//tries to delete teh game based on user request
const tryDeletingGame = async (httpRequest,httpResponse)=>{
    var gameId = httpRequest.body.gameId;
    var deviceId = httpRequest.body.deviceId;
    var userWhoCreated;
    try{
        var res = await queries.getUserWhoCreatedGame(gameId);
        if(res.rows.length != 1){
            console.error(`deviceID: ${deviceId} attempted to delete game: ${gameId} that didn't exist`);
            httpResponse.status(403).send("Delete Forbidden");
            return;
        }
        userWhoCreated = res.rows[0];
    }catch(err){
        errors.handleServerError("getUserWhoCreatedGame",httpResponse,err);
    }
    var userNumberThatCreated = userWhoCreated.user_number;
    var userNumberRequested;    //user number of the device that requested a delete
    try{
        var res = await queries.getUserNumberQuery(deviceId); //gets the user number of  deviceID who requested delete
        if(res.rows.length != 1){   //if user for this device doesn't exist
            console.log(`DeviceID: ${deviceId} that doesn't exist tried to delete a game`);
            httpResponse.status(400).send("Bad Request");
            return;
        }else{
            userNumberRequested = res.rows[0].user_number;
        }
    }catch(err){
        errors.handleServerError("getUserNumberQuery",httpResponse,err);
    }
    if(userNumberThatCreated == userNumberRequested){
        try{
            await queries.deleteAllRegionsAssociatedWithGameId(gameId);
            await queries.deleteGame(gameId);
        }catch(err){
            errors.handleServerError("deleteGame/deleteRegions",httpResponse,err);
            return;
        }
        httpResponse.status(200).send("Successfully deleted game.")
    }else{  //invalid delete
        console.error(`device id: ${deviceId} tried to delete a game that wasn't theirs to delete: ${gameId}`);
        httpResponse.status(403).send("Delete Forbidden");
        return;
    }
}


//basically delete all games associated with a user
const tryDeletingGameNoGameId = async (httpRequest,httpResponse)=>{
    var deviceId = httpRequest.query.deviceId;
    if(!deviceId){
        console.error("Delete games attempted without deviceId");
        httpResponse.status(400).send("Bad Delete");
        return;
    }
    var gamesUserCreated;
    try{
        var res = await queries.getGamesDeviceCreated(deviceId);
        gamesUserCreated = res.rows;
    }catch(err){
        errors.handleServerError("getGamesDeviceCreated",httpResponse,err)
    }
    for(var i = 0; i < gamesUserCreated.length; ++i){
        try{
            await queries.deleteAllRegionsAssociatedWithGameId(gamesUserCreated[i].game_id);
            await queries.deleteGame(gamesUserCreated[i].game_id);
            await queries.deleteCoins(gamesUserCreated[i].game_id);
        }catch(err){
            errors.handleServerError("deleting games",httpResponse,err);
            return;
        }
    }
    httpResponse.status(200).send(`Deleted ${gamesUserCreated.length} games`);


}

module.exports = {
    tryDeletingGame,
    tryDeletingGameNoGameId
}
