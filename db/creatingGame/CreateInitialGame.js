const { response } = require('express');
const errors = require('../helpers/Errors')

const queries = require("../helpers/Queries");
const getUser = require("../helpers/getUser");


const validLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const GAME_ID_LENGTH = 6

//this function generates a random series of characters of length GAME_ID_LENGTH
//from the character set validLetters
function generateRandomGameID() {
    returnString = ""
    for (var i = 0; i < GAME_ID_LENGTH; i++) {
        index = Math.floor(Math.random() * validLetters.length)
        returnString += validLetters[index];
    }
    return returnString
}

//request url should look like /?deviceId=asdfsdaf-dsfewqrew

//the master createGame function that gets called when a user wants to create a game.
const createGame = async (httpRequest, httpResponse) => {
    const deviceId = httpRequest.query.deviceId
    if (!deviceId) {      //if the device id isn't there.
        httpResponse.status(400).send("Invalid Request!"); //Device ID is not included in request.
        return;
    }
    //get the user associated with this device ID
    var userNumber = await getUser.getUser(httpResponse,deviceId);
    if(userNumber == -1){   //if getting the user failed.
        return;
    }else{
        createGameForUserNumber(httpRequest,httpResponse,userNumber);
    }
    

}


//Creates a game for a user with user_number: userNumber. Sends back the game ID 
//via the http response.
async function createGameForUserNumber(httpRequest,httpResponse,userNumber){
    var inUseGameIds;
    try{
        var res = await queries.getGameIds(); //get all the current gameIds
        inUseGameIds = res.rows;
    }catch(err){
        errors.handleServerError("getGameIds",httpResponse,err);
        return;
    }
    var gameId = ""
    var usedGameIds = {}
    inUseGameIds.forEach((gameId)=>usedGameIds[gameId] = 1);    //set up our dictionary of used gameIDs
    gameIDUnique = false;
    while (!gameIDUnique) {   //loop until we get a valid game id. This is a terrible way to do this, but it's probably fast.
        gameId = generateRandomGameID();
        if (usedGameIds[gameId] != 1) {
            gameIDUnique = true
        }
    }
    insertGameWithUserNumber(httpRequest,httpResponse,userNumber,gameId);
    

}


//Creates a game, and then creates a game info attached to it with bare minimum info
//if all inserts succeed, send back a success to the user. Else, send back an internal server error.
//note that an error that might show up is that each user can have only one game they own.
async function insertGameWithUserNumber(httpRequest,httpResponse,userNumber,gameId){

    try{
        //create the game along with the game info for it.
        await queries.createGameQuery(userNumber,gameId);
        await queries.createGameInfoQuery(gameId);
        
    }catch(err){
        errors.handleServerError("createGame",httpResponse,err);
        return;
    }

    httpResponse.status(200).send(JSON.stringify({"gameId":gameId}))


}





module.exports = {
    createGame,
}

