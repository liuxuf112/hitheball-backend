const errors = require("../helpers/Errors")
const queries = require("../helpers/Queries")
const Gamemodes= require("../helpers/Gamemodes")

const createRegions = require("./CreateRegions");
const teams = require("./Teams");
const cookies = require("./initializeCookieAmounts");
const { POSSIBLE_COOKIE_TYPES } = require("../helpers/CookieConstants");
const setGameInfo = async (httpRequest,httpResponse) =>{
    var body = httpRequest.body;
    //first thing we need to do is figure out who the user for the game is.
    var userWhoCreatedGame;
    try{    //get the user number of the game creator
        var res = await queries.getUserWhoCreatedGame(body.gameId);
        userWhoCreatedGame = res.rows[0].user_number;
    }catch(err){
        errors.handleServerError("getUserWhoCreatedGame",httpResponse,err);
        return;
    }
    var userNumberWhoRequested;
    try{    //get the user number of the user who requested the set
        var res = await queries.getUserNumberQuery(body.deviceId)
        userNumberWhoRequested = res.rows[0].user_number;
    }catch(err){
        errors.handleServerError("getUserNumberQuery",httpResponse,err)
        return;
    }
      
    //verifying
    if(userNumberWhoRequested != userWhoCreatedGame){
        httpResponse.status(401).send("Unauthorized update");
        return;
    }else{
        actuallySetGameInfo(httpRequest,httpResponse,body);
    }
     
}


//this function updates info once we now the person who sent the request
//is a valid updater for the game.
async function actuallySetGameInfo(httpRequest,httpResponse,body){
    //TODO: check that everything is in the right range, and everything is included
    //should probabily validate values are within ranges here, but ignore that for now.
    var gameRegions;
    try{
        var res = await queries.checkIfGameHasRegion(body.gameId);
        gameRegions = res.rows;
    }catch(err){
        errors.handleServerError("checkIfGameHasRegion",httpResponse,err);
        return;
    }

    //checking that the game mode is valid
    var gamemode = body.gameType;
    if(gamemode == null){
        gamemode = body.gameType = 0;
    }
    if(!(gamemode in Gamemodes.possibleGamemodes)){ //if the gamemode isn't an option
        console.error(`Invalid gamemode submitted by deviceId ${body.deviceId}: ${gamemode}`);
        httpResponse.status(400).send("Bad Request, invalid game mode.");
        return;
    }
    

    //if game info doesn't exist yet
    if(gameRegions.length != 0 && gameRegions[0].region_id){    //if the game already has a region
        regionId = gameRegions[0].region_id;
        body.regionId = regionId;
        try{
            await queries.updateRegion(regionId,body.region);

        }catch(err){
            errors.handleServerError("updateRegion",httpResponse,err);
            return;
        }
    }else{
        try{
            var res = await queries.createRegion(body.region);
            body.regionId = res.rows[0].region_id;
        }catch(err){
            errors.handleServerError("createRegion",httpResponse,err);
            return;
        }
    }

    //now we update the game info with the region
    updateGameInfoWithRegion(httpRequest,httpResponse,body);
    
}
//gets called after a region is either updated or set.
async function updateGameInfoWithRegion(httpRequest,httpResponse,body){

    try{
        await queries.updateGameInfo(body);
    }catch(err){
        errors.handleServerError("updateGameInfo",httpResponse,err);
        return
    }
    var res = await teams.tryCreatingTeams(httpRequest,httpResponse,body.gameId); //try to create the teams
    if(res==errors.ASYNC_FAILURE){
        return;
    }

    res = await createRegions.createTeamRegions(httpRequest,httpResponse,body.gameId,res.teamOneId,res.teamTwoId,body.divideByLatitude); //try to make the team regions
    if(res == errors.ASYNC_FAILURE){   //if all worked out, we're good to go!
        return;
    }
        

    if(body.cookieAmounts==null){
        body.cookieAmounts = []
        for(var i = 0; i < POSSIBLE_COOKIE_TYPES; i++){ //if no cookies are assigned, assume 0 of all.
            body.cookieAmounts.push(0);
        }
      
    }
    var res = await cookies.initializeCookieAmounts(httpRequest,httpResponse,body.cookieAmounts,body.gameId);
    if(res==errors.ASYNC_FAILURE){
        return;
    }else{
        httpResponse.status(200).send("Game Info Updated!");
    }
    
    
}



module.exports={
    setGameInfo,
}