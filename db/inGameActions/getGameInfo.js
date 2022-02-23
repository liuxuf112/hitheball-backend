const queries = require('../helpers/Queries');

const errors = require('../helpers/Errors');

const coordCalculations = require("../helpers/coordinateCalculations")

const classesFile = require("../helpers/Classes");
const { isPlayerInvisible } = require('../helpers/isPlayerInvisible');
//default function that will first check if a device is in the game it requested, and if so will call the callback function.
async function checkIfDeviceMatchesGameID(httpRequest,httpResponse,callback,callbackErrorMessage){
    const deviceId = httpRequest.query.deviceId;
    const gameId = httpRequest.query.gameId;


    if(!deviceId || !gameId){
        console.error(callbackErrorMessage + " requested with deviceId: " + deviceId + "gameId: " + gameId);
        httpResponse.status(400).send("bad request");
        return;
    }

    var userGameIds;
    try{
        var res = await queries.getGameIdOfDeviceId(deviceId);
        userGameIds = res.rows;
    }catch(err){
        errors.handleServerError("getGameIdOfDevieId",httpResponse,err);
        return;
    }

    if(userGameIds.length == 0){   //device ID is not in a game
        console.error("deviceID: " + deviceId + " " + callbackErrorMessage + " info for a game, but they're not in one");
        httpResponse.status(506).send("no longer in game");
    }else if(res.rows.length > 1){ //more than one game for a deviceId, should be impossible.
        console.error("deviceId: " + deviceId + " is in more than one game");
        httpResponse.status(500).send("Internal Server Error");
    }else if(res.rows.length == 1){ //user is in exactly one game
        var userGameId = res.rows[0].game_id;
        
        if(gameId == userGameId){   //user is in the right game, call the callback function
            callback(httpRequest,httpResponse,gameId,deviceId);

        }else{//user trying to access game they're not in.
            console.error("DeviceId attempted to " + callbackErrorMessage + " for a game they're not in: ",deviceId);
            httpResponse.status(404).send("Not Found"); //don't tell the requester that it's a valid gameId
        }
    }
   
}


//returns a body that looks like: 
/*

[
    {
        userName: dfsdafdsa
        teamNumber: 1
    },
    {
        userName: dfsafd,
        teamNumber: 2
    }
]


*/

//request should have deviceId param and gameId param
const getAllPlayersInGame = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendAllPlayersInGame,"GetAllPlayersInGame")

   
}

//sends usernames and team_numbers for all players.
async function sendAllPlayersInGame(httpRequest,httpResponse,gameId,deviceId){
    var sendBody = {}
    
    try{
        var res = await queries.getUsersInGameId(gameId);
        sendBody.players = res.rows;
        
    }catch(err){
        errors.handleServerError("getUsersInGameId",httpResponse,err);
        return;
    }  
    try{
        var res = await queries.getGameInfo(gameId);
        sendBody.maxPlayers = res.rows[0].max_players;
    }catch(err){
        errors.handleServerError("getMaxPlayers",httpResponse,err);
    }

    httpResponse.status(200).send(JSON.stringify(sendBody));
}


//returns team colors and player count for both teams.

const getTeamsInfoForGame = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendTeamsInfoForGame,"GetTeamsInfoForGame");
    
}


//sends the playercounts as well as the team colors for a specific team
async function sendTeamsInfoForGame(httpRequest,httpResponse,gameId,deviceId){
    var teams;
    try{
        var res = await queries.getTeamsWithGameId(gameId);
        teams = res.rows;
    }catch(err){
        errors.handleServerError("getTeamsWithGameId",httpResponse,err);
    }
   
    var sendBody = {};
    var teamOneId = teams[0].team_id;
    var teamTwoId = teams[1].team_id;

    try{
        var res = await queries.getTeamCountAndColor(teamOneId);
        sendBody[1] = res.rows[0];  //assigning sendbody at "1" to the team count and color info
    }catch(err){
        errors.handleServerError("getTeamCountAndColor team 1",httpResponse,err);
        return;
    }
    try{
        var res = await queries.getTeamCountAndColor(teamTwoId);
        sendBody[2] = res.rows[0]; //assigning sendBody at "2" to team count and color info
    }catch(err){
        errors.handleServerError("getTeamCountAndColor team 2",httpResponse,err);
        return;
    }
    httpResponse.status(200).send(JSON.stringify(sendBody));
       
   
}

//returns all your teammates locations (including your own!)
const getTeammatesLocations = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendTeammatesLocationInfo,"Get Teammates Locations");
}

//converts someting like 
/*
[
  {
    player_location: { x: 2, y: 2 },
    username: 'notJacob',
    flag_id: null
  },
  { player_location: null, username: 'notJacob', flag_id: null },
  { player_location: null, username: 'notJacob', flag_id: null },
  { player_location: null, username: 'notJacob', flag_id: null }
]
 
to something like this:
[{"location":{"latitude":2,"longitude":2},
"username":"notJacob","hasFlag":false},
{"location":null,"username":"notJacob","hasFlag":false},
{"location":null,"username":"notJacob","hasFlag":false},
{"location":null,"username":"notJacob","hasFlag":false}]
*/
async function convertTeammatesRowsToSendableBody(httpRequest,httpResponse,teammates,enemyFlags,className){
    var sendBody = [];
    for(var i = 0; i < teammates.length; i++){
        var playerInfo = {};
        if(teammates[i].player_location && (className !=="Rook" || teammates[i].flag_id) ){ //if the player location exists
            playerInfo.latitude = teammates[i].player_location.x;
            playerInfo.longitude = teammates[i].player_location.y;
        }else{ //if the location doesn't exist
            playerInfo.latitude = null;
            playerInfo.longitude = null;
        }
        
        if(teammates[i].flag_id){   //if the player has a flag we need to reassi 
           
            playerInfo.hasFlag = true;
            for(var j = 0; j < enemyFlags.length; j++){ //finding the flag number based on flag_id.
                if(teammates[i].flag_id == enemyFlags[j].flag_id){
                    playerInfo.flagNumber = enemyFlags[j].flag_number;
                    break;
                }
            }
        }else{
            playerInfo.hasFlag = false;
        }
        playerInfo.eliminated = teammates[i].is_eliminated;
        playerInfo.username = teammates[i].username;
        playerInfo.class=teammates[i].class;

        if(await isPlayerInvisible(httpRequest,httpResponse,playerInfo.player_id)){
            playerInfo.invisible = true;
        }else{
            playerInfo.invisible = false;
        }

        
        sendBody.push(playerInfo);
        
    }
    return sendBody;
}

//sends the teams location data to the person requesting it.
async function sendTeammatesLocationInfo(httpRequest,httpResponse,gameId,deviceId){
    var teammates;
    try{ //get my teammates
        var res = await queries.getAllTeammates(deviceId);
        teammates = res.rows;
    }catch(err){
        errors.handleServerError("getAllTeammates",httpResponse,err);
        return;
    }
    var enemyFlags;
    try{ //find out where the enemy flags are (so we can tell if teammate is holding flag)
        var res = await queries.getLocationsOfEnemyFlags(deviceId);
        enemyFlags = res.rows;

    }catch(err){
        errors.handleServerError("getLocationsOfEnemyFlags",httpResponse,err);
        return;
    }


    //Now we get the class of the deviceID. Different classes receive different info.
    var player;
    try{
        var res = await queries.getPlayerInfoFromDeviceId(deviceId);
        player = res.rows[0];
    }catch(err){
        errors.handleServerError("getPlayerInfoFromDeviceId",httpResponse,err);
        return;
    }
    var playerClass = player.class;
    var classString = classesFile.classNames[playerClass];
   

    var sendBody = await convertTeammatesRowsToSendableBody(httpRequest,httpResponse,teammates, enemyFlags,classString);
    if(sendBody==errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE;
    }
    httpResponse.status(200).send(JSON.stringify(sendBody));

   

}




//returns the clock info of the current game. all info is returned in UTC.
const getClockInfo = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendClockInfoForGame,"Send Clock Info For Game");
}

//will send start date, start time, and game length for the chosen game.
async function sendClockInfoForGame(httpRequest,httpResponse,gameId,deviceId){
    var gameInfo;
    try{
        var res = await queries.getGameInfo(gameId);
        gameInfo = res.rows[0]
    }catch(err){
        errors.handleServerError("getGameInfo",httpResponse,err);
    }
    var sendBody = {};
    sendBody.timezone="UTC";
    sendBody.gameStarted = gameInfo.start_time_stamp ? true : false;
    sendBody.startTimeStamp = gameInfo.start_time_stamp;
    sendBody.gameLength = gameInfo.game_length;
    httpResponse.status(200).send(JSON.stringify(sendBody));
    

}


//returns the location of the flags that belong to your team 
//along with whether an enemy player is holding it.
const getMyTeamsFlags = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendTeamFlagInfo,"getMyTeamsFlags");
    
}


//probably not a good way to do this.
async function generateFlagSendBody(httpRequest,httpResponse,flagHomeLocations,flagStolenLocations){
    
    for(var i = 0; i < flagStolenLocations.length; i++){
        
        for(var j = 0; j < flagHomeLocations.length; j++){
            if(flagHomeLocations[j].flag_id == flagStolenLocations[i].flag_id){
                flagHomeLocations[j].flag_location = flagStolenLocations[i].player_location;
                flagHomeLocations[j].flagStolen = true;
                if(await isPlayerInvisible(httpRequest,httpResponse,flagStolenLocations[i].player_id)){
                    flagHomeLocations[j].invisible=true;
                }
                break; //if we find the flag in the home locations, no reason to do the other ones.
            }
           
        }
    }
    var flagSendBody = [];
    for(var i = 0; i < flagHomeLocations.length; i++){
        var flagInfo = {};
        if(flagHomeLocations[i].flagStolen){
            flagInfo.stolen=true;
        }else{
            flagInfo.stolen=false;
        }
        if(flagHomeLocations[i].invisible){
            flagInfo.invisible = true;
            flagInfo.latitude = null;
            flagInfo.longitude = null;
        }else{
            flagInfo.invisible = false;
            flagInfo.latitude = flagHomeLocations[i].flag_location.x;
            flagInfo.longitude = flagHomeLocations[i].flag_location.y;
        }
        flagInfo.flagNumber = flagHomeLocations[i].flag_number;
        flagSendBody.push(flagInfo);
    }
   
    return flagSendBody;

}

//sends where all your team's flags are located. already verified that you're in a game
async function sendTeamFlagInfo(httpRequest,httpResponse,gameId,deviceId){

    var flagHomeLocations;   //where flags would be if they weren't stolen
    var flagStolenLocations; //where flags would be if they were stolen
    try{
        var res = await queries.getLocationsOfMyTeamsFlags(deviceId);
        flagHomeLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfMyTeamsFlags",httpResponse,err);
    }
    
    try{
        var res = await queries.getLocationsOfHeldFlagsOnEnemyTeam(deviceId);
        flagStolenLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationOfHeldFlagsOnEnemyTeam",httpResponse,err);
    }
    var sendBody = await generateFlagSendBody(httpRequest,httpResponse,flagHomeLocations,flagStolenLocations);
    if(sendBody == errors.ASYNC_FAILURE){
        return;
    }
    httpResponse.status(200).send(JSON.stringify(sendBody));
      
    
}


//returns a list of enemies, with location info if you can see them.

const getEnemiesInViewRadius = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendEnemiesInViewRadius,"getEnemiesInViewRadius")
}
async function sendEnemiesInViewRadius(httpRequest,httpResponse,gameId,deviceId){   
    var playerLocation; //where we are
    var viewRadius; //how far we can see
    var enemyLocations; //enemy locations
    var myFlagLocations; //my flag locations
    try{
        var res = await queries.getDeviceLocation(deviceId);
        playerLocation = res.rows[0].player_location;
        viewRadius = res.rows[0].view_radius;

    }catch(err){
        errors.handleServerError("getDeviceLocation",httpResponse,err);
        return;
    }
    if(playerLocation == null){
        console.error("device: " + deviceId + " requested enemy location info without having a location themselves!");
        httpResponse.status(400).send("You have not set your user location yet!");
        return;
    }
    
    
    //get location of all the enemies
    try{
       var res = await queries.getLocationsOfEnemies(deviceId);
       enemyLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfEnemies",httpResponse,err);
        return;
    }

    //get the location of all of my team flags (in case the enemy is holding them)
    try{
        var res = await queries.getLocationsOfMyTeamsFlags(deviceId);
        myFlagLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfMyTeamsFlags",httpResponse,err);
        return;
    }

    //next we need to get the class.
    var player;
    try{
        var res = await queries.getPlayerInfoFromDeviceId(deviceId);
        player = res.rows[0];
    }catch(err){
        errors.handleServerError("getPlayerInfoFromDeviceId",httpResponse,err);
        return;
    }
    var playerClass = player.class;
    var classString = classesFile.classNames[playerClass];
    
   
    var sendBody = await createEnemyLocationSendBody(httpRequest,httpResponse,playerLocation,viewRadius,enemyLocations,myFlagLocations,classString);
    if(sendBody == errors.ASYNC_FAILURE){
        return;
    }
    httpResponse.status(200).send(JSON.stringify(sendBody));

   
   
}



//creates and returns a body of enemies that the current player can see,
//as well as those they can't without a location attached.
//if a player has a flag, sends back that info as well.
//unsure if this should always be the case.
async function createEnemyLocationSendBody(httpRequest,httpResponse,playerLocation,viewRadius,enemyLocations,myTeamsFlagsLocations,className){
    var sendBody = [];
    for(var i = 0; i < enemyLocations.length; i++){
        //if we can see the enemy
        var enemyBody = {};
        
        //if you're a rook... or you can see the enemy... or the enemy has a flag... add them to the view radius. Unless they don't have locations defined yet. 
        if((className =="Rook" && enemyLocations[i].player_location)
        || (enemyLocations[i].player_location && 
        coordCalculations.checkIfPointsWithinDistance(playerLocation.x,playerLocation.y,enemyLocations[i].player_location.x,enemyLocations[i].player_location.y,viewRadius)) 
        || enemyLocations[i].flag_id 
        ){    //if you're a rook and the enemy is defined.

            //check if the enemy is invisible, if not assign location data
            var playerInvisible = await isPlayerInvisible(httpRequest,httpResponse,enemyLocations[i].player_id)
            if(playerInvisible == errors.ASYNC_FAILURE){
                return errors.ASYNC_FAILURE;
            }
            if(playerInvisible){
                enemyBody.seen=false;

            }else{
                enemyBody.seen = true;
                enemyBody.latitude = enemyLocations[i].player_location.x;
                enemyBody.longitude = enemyLocations[i].player_location.y;
            }
        

        }else{
            enemyBody.seen = false;
        }
       
        if(enemyLocations[i].flag_id){   //if they have flag id, look through my teams flags to find the flag number.
            enemyBody.hasFlag = true;
            for(var j = 0; j < myTeamsFlagsLocations.length; j++){
                if(enemyLocations[i].flag_id == myTeamsFlagsLocations[j].flag_id){
                    enemyBody.flagNumber = myTeamsFlagsLocations[j].flag_number;
                    break;
                }
            }
        }else{
            enemyBody.hasFlag = false;
        }
        enemyBody.eliminated = enemyLocations[i].is_eliminated;
        enemyBody.class = enemyLocations[i].class;
        enemyBody.hasFlag = enemyLocations[i].flag_id ? true : false;
        enemyBody.username = enemyLocations[i].username;
        sendBody.push(enemyBody);
    }
    return sendBody;
}

//gets all the enemy flags in your view radius
const getEnemyFlags = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendEnemyFlagsInViewRadius,"getEnemyFlags")
}


async function sendEnemyFlagsInViewRadius(httpRequest,httpResponse,gameId,deviceId){
    var playerLocation;
    var viewRadius;
    var enemyFlags;
    var flagStolenLocations;
    try{
        var res = await queries.getDeviceLocation(deviceId);
        playerLocation = res.rows[0].player_location;
        viewRadius = res.rows[0].view_radius;
    }catch(err){
        errors.handleServerError("getDeviceLocation",httpResponse,err);
    }
    //can't send flags if our view radius is null 
    if(playerLocation == null){
        console.error("device: " + deviceId + " requested enemy location info without having a location themselves!");
        httpResponse.status(400).send("You have not set your user location yet!");
        return;
    }

    //get the locations of the enemy flags
    try{
        var res = await queries.getLocationsOfEnemyFlags(deviceId);
        enemyFLags = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfEnemies",httpResponse,err);
        return;
    }

    //get locations of held flags on my team to see if we have any of them
    try{
        var res = await queries.getLocationsOfHeldFlagsOnMyTeam(deviceId);
        flagStolenLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfHeldFlagsOnMyTeam",httpResponse,err);
    }

    var sendBody = await createEnemyFlagsSendBody(playerLocation,viewRadius,enemyFlags,flagStolenLocations);
    if(sendBody == errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE;
    }
    httpResponse.status(200).send(JSON.stringify(sendBody));
    
}
//flagStolenLocations holds which players on YOUR team have flags
//enemyFlags holds a list of all the enemyflags and their ids
//player location is your location
//view radius is your view radius.
//if it's a queen we need to send the god damn flag.
async function createEnemyFlagsSendBody(playerLocation,viewRadius,enemyFlags,flagStolenLocations,classString,playerId){
    //first we need to update the enemy flags location if they are held by one of our players.
    for(var i = 0; i < flagStolenLocations.length; i++){
        
        for(var j = 0; j < enemyFlags.length; j++){
            if(enemyFlags[j].flag_id == flagStolenLocations[i].flag_id){
                enemyFlags[j].flag_location = flagStolenLocations[i].player_location;
                enemyFlags[j].flagStolen = true;
                break; //if we find the flag in the home locations, no reason to do the other ones.
            }
           
        }
    }
   

    //if the class is a queen we also need to send their specific flag
    var queenFlagNumber = -1;
    if(classString === "Queen"){
        try{
            var res = await queries.getQueenFlagNumber(playerId);
            queenFlagNumber = res.rows[0].flag_number;
        }catch(err){
            console.error(`Couldn't find queen flag number for player: ${playerId}`);
        }
    }
     //then we take those locations
    var sendBody = [];
    for(var i = 0; i < enemyFlags.length; i++){       
        //first check is there because it's possible the enemy player won't have a location defined yet.
        //if the flag is within our range or stolen by a teammate, send the info.
        //third check is there to see if it's the queen flag if we're a queen.
        if(enemyFlags[i].flag_location && (coordCalculations.checkIfPointsWithinDistance(playerLocation.x,playerLocation.y,enemyFlags[i].flag_location.x,enemyFlags[i].flag_location.y,viewRadius) || 
        enemyFlags[i].flagStolen ||
        queenFlagNumber == enemyFlags[i].flag_number)){
            var enemyFlag = {};
        
            enemyFlag.stolen = enemyFlags[i].flagStolen;
            enemyFlag.latitude = enemyFlags[i].flag_location.x;
            enemyFlag.longitude = enemyFlags[i].flag_location.y;
            enemyFlag.flagNumber = enemyFlags[i].flag_number;
            sendBody.push(enemyFlag);
        }
    }
    return sendBody;
}


//gets the regions for a game.
const getGameRegions = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendGameRegions,"getGameRegions")   
}

//send the game regions. Main region, and both of the team regions.
async function sendGameRegions(httpRequest,httpResponse,gameId,deviceId){
    var gameRegion;
    var teamOneRegion;
    var teamTwoRegion;
    try{
        var res = await queries.getGameRegion(gameId);
        gameRegion = res.rows[0];
    }catch(err){
        errors.handleServerError("getGameRegion",httpResponse,err);
        return;
    }

    try{
        var res = await queries.getRegionOfTeamNumber(1,gameId);
        var teamOneRegion = res.rows[0];
    }catch(err){
        errors.handleServerError("getRegionOfTeamNumber 1",httpResponse,err);
        return;
    } 
      
    try{
        var res = await queries.getRegionOfTeamNumber(2,gameId);
        teamTwoRegion = res.rows[0];
    }catch(err){
        errors.handleServerError("getRegionOfTeamNumber 2",httpResponse,err);
        return;
    }
        
    var sendBody = createRegionsSendBody(gameRegion,teamOneRegion,teamTwoRegion);
    httpResponse.status(200).send(JSON.stringify(sendBody));
          
       
  
}

//creates the send body based on the regions, and returns it.
function createRegionsSendBody(gameRegion,teamOneRegion,teamTwoRegion){
    var sendBody = {};
    sendBody.gameRegion=[];
    sendBody.teamOneRegion=[];
    sendBody.teamTwoRegion=[];
    //add all the lats and longs for gameRegion
    sendBody.gameRegion.push({latitude:gameRegion.corner1.x,longitude:gameRegion.corner1.y});
    sendBody.gameRegion.push({latitude:gameRegion.corner2.x,longitude:gameRegion.corner2.y});
    sendBody.gameRegion.push({latitude:gameRegion.corner3.x,longitude:gameRegion.corner3.y});
    sendBody.gameRegion.push({latitude:gameRegion.corner4.x,longitude:gameRegion.corner4.y});

    //add all them for team one
    sendBody.teamOneRegion.push({latitude:teamOneRegion.corner1.x,longitude:teamOneRegion.corner1.y});
    sendBody.teamOneRegion.push({latitude:teamOneRegion.corner2.x,longitude:teamOneRegion.corner2.y});
    sendBody.teamOneRegion.push({latitude:teamOneRegion.corner3.x,longitude:teamOneRegion.corner3.y});
    sendBody.teamOneRegion.push({latitude:teamOneRegion.corner4.x,longitude:teamOneRegion.corner4.y});


    //add all them for team two
    sendBody.teamTwoRegion.push({latitude:teamTwoRegion.corner1.x,longitude:teamTwoRegion.corner1.y});
    sendBody.teamTwoRegion.push({latitude:teamTwoRegion.corner2.x,longitude:teamTwoRegion.corner2.y});
    sendBody.teamTwoRegion.push({latitude:teamTwoRegion.corner3.x,longitude:teamTwoRegion.corner3.y});
    sendBody.teamTwoRegion.push({latitude:teamTwoRegion.corner4.x,longitude:teamTwoRegion.corner4.y});
    return sendBody;
}


//gets all info required for the map screen rendering EXCEPT FOR THE REGIONS
//the reason the regions aren't sent is because the regions should only be sent once. 
const getMapScreenInfo = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendMapScreenInfo,"getMapScreenInfo");
}

//sends all info for map screen.
//sends your team's locations
//sends your team's flags
//sends enemy players you can see.
//sends enemy flags you can see.
async function sendMapScreenInfo(httpRequest,httpResponse,gameId,deviceId){
    var flagHomeLocations,flagStolenLocations;
    var flagSendBody;
    var allTeammates;
    var enemyFlags;
    var teammatesBody;
    var playerLocation,viewRadius;
    var enemyLocations, enemyLocationsSendBody;
    var sendBody = {};
    
    try{
        var res = await queries.getLocationsOfMyTeamsFlags(deviceId);
        flagHomeLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfMyTeamsFlags",httpResponse,err);
        return;
    }

    try{
        var res = await queries.getLocationsOfHeldFlagsOnEnemyTeam(deviceId);
        flagStolenLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfHeldFlagsOnEnemyFlag",httpResponse,err);
        return;
    }
    
    flagSendBody =await generateFlagSendBody(httpRequest,httpResponse,flagHomeLocations,flagStolenLocations);
  
    try{
        var res = await queries.getAllTeammates(deviceId);
        allTeammates = res.rows;
    }catch(err){
        errors.handleServerError("getAllTeammates",httpResponse,err);
        return;
    }      
    
    try{
        var res = await queries.getLocationsOfEnemyFlags(deviceId);
        enemyFlags = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfEnemyFlags",httpResponse,err);
        return;
    }

    //next we need to get the class.
    var player;
    try{
        var res = await queries.getPlayerInfoFromDeviceId(deviceId);
        player = res.rows[0];
    }catch(err){
        errors.handleServerError("getPlayerInfoFromDeviceId",httpResponse,err);
        return;
    }
    var playerClass = player.class;
    var classString = classesFile.classNames[playerClass];


    
    teammatesBody = await convertTeammatesRowsToSendableBody(httpRequest,httpResponse,allTeammates,enemyFlags,classString);
    if(teammatesBody == errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE
    }
    
    try{
        var res = await queries.getDeviceLocation(deviceId);
        playerLocation = res.rows[0].player_location;
        viewRadius = res.rows[0].view_radius;
    }catch(err){
        errors.handleServerError("getDeviceLocation",httpResponse,err);
        return;
    }
    if(playerLocation == null){
        console.error("device: " + deviceId + " requested enemy location info without having a location themselves!");
        httpResponse.status(400).send("You have not set your user location yet!");
        return;
    }
     
    try{
        var res = await queries.getLocationsOfEnemies(deviceId);
        enemyLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfEnemies",httpResponse,err);
        return;
    }
    enemyLocationsSendBody = await createEnemyLocationSendBody(httpRequest,httpResponse,playerLocation,viewRadius,enemyLocations,flagHomeLocations,classString);
         
    try{
        var res = await queries.getLocationsOfHeldFlagsOnMyTeam(deviceId);
        flagStolenLocations = res.rows;
    }catch(err){
        errors.handleServerError("getLocationsOfHeldFlagsOnMyTeam",httpResponse,err);
        return;
    }
             



    var enemyFlagsBody = await createEnemyFlagsSendBody(playerLocation,viewRadius,enemyFlags,flagStolenLocations,classString,player.player_id);
    if(enemyFlagsBody == errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE;
    }
    sendBody.teamFlags = flagSendBody;
    sendBody.teammates = teammatesBody;
    sendBody.enemys=enemyLocationsSendBody;
    sendBody.enemyFlags = enemyFlagsBody;
  
    httpResponse.status(200).send(JSON.stringify(sendBody));
         
}


//creates the sendable body from the cookies pulled from the database.
function createCookiesSendBody(cookies){
    var cookiesSendBody = [];
    for(var cookie of cookies){
        if(cookie.player_id==null){ //if a player has the cookie currently
            var betterCookie = {}
            betterCookie.type = cookie.cookie_type;
            betterCookie.cookieNumber = cookie.cookie_number;
            betterCookie.longitude = cookie.cookie_location.x;
            betterCookie.latitude = cookie.cookie_location.y;
            betterCookie.secondOfCookie = cookie.activation_length;
            cookiesSendBody.push(betterCookie);
        }
    }
    return cookiesSendBody;
}



const getGameStarted = (httpRequest,httpResponse)=>{
    checkIfDeviceMatchesGameID(httpRequest,httpResponse,sendGameStarted,"getGameStarted");
}

async function sendGameStarted(httpRequest,httpResponse,gameId,deviceId){
    var gameInfo;
    var sendBody = {};
    try{
        var res = await queries.getGameInfo(gameId);
        gameInfo = res.rows[0];

    }catch(err){
        errors.handleServerError("getGameInfo",httpResponse,err);
        return;
    }   
    if(gameInfo.start_time_stamp){
        sendBody.gameStarted=true;
    }else{
        sendBody.gameStarted=false;
    }
    httpResponse.send(JSON.stringify(sendBody));

        
}


module.exports={
    getAllPlayersInGame,
    getTeamsInfoForGame,
    getTeammatesLocations,
    getClockInfo,
    getMyTeamsFlags,
    getEnemiesInViewRadius,
    getGameRegions,
    getMapScreenInfo,
    getEnemyFlags,
    getGameStarted,
    checkIfDeviceMatchesGameID
}