
const poolFile = require('./pool');
//creates a new game info from a gameID, only sets the create time and date. Returns the create time
function createGameInfoQuery(game_id){
    return poolFile.pool.query('INSERT INTO game_infos (game_id,create_time_stamp) VALUES($1,NOW()) RETURNING create_time_stamp',[game_id]);
}

//a function that returns a user number given a device ID.

function createGameQuery(userNumber,gameId){
    return poolFile.pool.query('INSERT INTO games (game_id,user_number) VALUES($1,$2)',[gameId,userNumber]);
}



//creates a new region and returns the regionID.
function createRegion(region){

    lat1 = region[0].latitude;
    lat2 = region[1].latitude;
    lat3 = region[2].latitude;
    lat4 = region[3].latitude
    long1 = region[0].longitude;
    long2 = region[1].longitude;
    long3 = region[2].longitude;
    long4 = region[3].longitude;
    return poolFile.pool.query('INSERT INTO regions (corner1,corner2,corner3,corner4) VALUES(POINT($1,$2),POINT($3,$4),POINT($5,$6),POINT($7,$8)) RETURNING region_id'
    ,[lat1,long1,lat2,long2,lat3,long3,lat4,long4]);
}


//updates a region at a certain regionId, returns nothing.
function updateRegion(regionId,region){
    lat1 = region[0].latitude;
    lat2 = region[1].latitude;
    lat3 = region[2].latitude;
    lat4 = region[3].latitude
    long1 = region[0].longitude;
    long2 = region[1].longitude;
    long3 = region[2].longitude;
    long4 = region[3].longitude;
    return poolFile.pool.query('UPDATE regions SET corner1=POINT($1,$2),corner2=POINT($3,$4),corner3=POINT($5,$6),corner4=POINT($7,$8) WHERE region_id=$9'
    ,[lat1,long1,lat2,long2,lat3,long3,lat4,long4,regionId]);
}

//tells you the gameId that the deviceID requested is in.
function getGameIdOfDeviceId(deviceId){
    return poolFile.pool.query('SELECT game_id FROM teams WHERE team_id IN (SELECT team_id FROM players WHERE user_number IN (SELECT user_number FROM users WHERE device_id=$1))',[deviceId]);
}



//checks if a game already has a region associated with it.
function checkIfGameHasRegion(gameId){
    return poolFile.pool.query('SELECT region_id FROM game_infos WHERE game_id=$1',[gameId]);
}

//returns a region of a game.
function getGameRegion(gameId){
    return poolFile.pool.query('SELECT regions.corner1, regions.corner2, regions.corner3, regions.corner4 FROM regions INNER JOIN game_infos ON regions.region_id=game_infos.region_id AND game_infos.game_id = $1',[gameId])
}

//returns game region based on team id
function getGameRegionFromTeamId(teamId){
    return poolFile.pool.query('SELECT regions.corner1, regions.corner2, regions.corner3, regions.corner4 FROM regions INNER JOIN game_infos ON regions.region_id=game_infos.region_id AND game_infos.game_id IN(SELECT game_id FROM teams WHERE team_id=$1)',[teamId])
}
//checks if a team has a region id. Returns empty list if it doesn't.
function checkIfTeamHasRegion(teamId){
    return poolFile.pool.query('SELECT region_id FROM teams WHERE team_id=$1',[teamId]);
}

//sets the region id for a team.
function setTeamRegionId(teamId,regionId){
    return poolFile.pool.query('UPDATE teams SET region_id = $1 WHERE team_id = $2',[regionId,teamId]);
}

function getRegionOfTeam(teamId){
    return poolFile.pool.query('SELECT corner1,corner2,corner3,corner4 from regions WHERE region_id IN (select region_id from teams where team_id=$1)',[teamId]);
}

function updateGameInfo(body){
    return poolFile.pool.query('UPDATE game_infos SET default_tag_radius=$1,default_view_radius=$2,max_players=$3,num_rounds=$4,current_round=$5,region_id=$6,game_length=$7,game_type=$8,flag_amount=$10 WHERE game_id=$9',
    [body.defaultTagRadius,body.defaultViewRadius,body.maxPlayers,body.numRounds,body.currentRound,body.regionId,body.gameLength,body.gameType,body.gameId,body.amountOfFlags]);
}

function getPlayerFromUserNumber(userId){
    return poolFile.pool.query('SELECT * FROM players WHERE user_number=$1',[userId]);
}

function getPlayerInfoFromDeviceId(deviceId){
    return poolFile.pool.query('SELECT * FROM players WHERE user_number IN(SELECT user_number FROM users WHERE device_id=$1)',[deviceId]);
}

function getPlayerFromUsername(username,gameId){
    return poolFile.pool.query(' SELECT * from players WHERE username=$1 AND team_id IN (SELECT team_id FROM teams WHERE game_id=$2)',[username,gameId])
}

function updatePlayerLocation(player_id,latitude,longitude){
    return poolFile.pool.query('UPDATE players SET player_location=POINT($1,$2) WHERE player_id=$3',[latitude,longitude,player_id]);
}
function updateEliminatedAndFlagStatus(player_id,newEliminated,newFlag){
    return poolFile.pool.query('UPDATE players SET is_eliminated = $1, flag_id=$2 where player_id=$3',[newEliminated,newFlag,player_id]);
}
//returns user number of user who created a game
function getUserWhoCreatedGame(gameId){
    return poolFile.pool.query('SELECT user_number FROM games WHERE game_id=$1',[gameId]);
}
function getDefaultRadiusesFromGame(gameId){
    return poolFile.pool.query('SELECT default_tag_radius,default_view_radius FROM game_infos WHERE game_id=$1',[gameId])
}

//returns the device_id of a user with user_number UserNumber
function getDeviceIdOfUser(userNumber){
    return poolFile.pool.query('SELECT device_id FROM users WHERE user_number=',[userNumber])
}

//returns all of the current game_ids
function getGameIds(){
    return poolFile.pool.query('SELECT game_id FROM games');
}


//returns the user_number of a user with device_id $1
function getUserNumberQuery(deviceId) {
    return poolFile.pool.query('SELECT user_number FROM users WHERE device_id=$1', [deviceId]);
}

//creates a user given a deviceID and returns the user number.
function createUserQuery(deviceId) {
    return poolFile.pool.query('INSERT INTO users (device_id,create_date) VALUES ($1, NOW()) RETURNING user_number', [deviceId]);
}

//creates a new player, if a player already exists for that user_number, reassigns the player to a new game.
function createPlayer(tag_radius,view_radius,username,team_id,user_number){
    return poolFile.pool.query('INSERT INTO players (tag_radius,view_radius,username,team_id,user_number,is_eliminated,class,coin_amount) VALUES($1,$2,$3,$4,$5,FALSE,0,0) ON CONFLICT (user_number) DO UPDATE SET tag_radius=$1,view_radius=$2,username=$3,team_id=$4,is_eliminated=FALSE,flag_id=null,class=0,coin_amount=0',[tag_radius,view_radius,username,team_id,user_number]);
}

//returns a list of teams that have the gameId "gameId"
function getTeamsWithGameId(gameId){
    return poolFile.pool.query('SELECT * from teams WHERE game_id=$1',[gameId]);
}

function getUsersInGameId(gameId){
    return poolFile.pool.query('SELECT players.player_id ,players.username,players.team_id,teams.team_number FROM players INNER JOIN teams ON teams.team_id = players.team_id WHERE teams.team_id IN (SELECT team_id FROM teams WHERE game_id=$1)',[gameId]);
}

//returns the count of players on the team as well as the color of the team.
function getTeamCountAndColor(teamId){
    return poolFile.pool.query('SELECT teams.team_color, COUNT(players.team_id) AS player_count FROM players INNER JOIN teams ON teams.team_id=players.team_id  WHERE players.team_id=$1 GROUP BY (teams.team_id)',[teamId])
}

//inserts a team, returning the team ID.
//Note that team number is either 1 or 2... it needs to be.
//enemy team ID can be null.
function createTeam(gameId,teamNumber,teamColor,enemy_team_id){
    return poolFile.pool.query('INSERT INTO teams (game_id,team_number,team_color,enemy_team_id) VALUES($1,$2,$3,$4) RETURNING team_id',[gameId,teamNumber,teamColor,enemy_team_id]);
}

function getGameIDUserCreated(deviceId){
    return poolFile.pool.query('SELECT game_id FROM games WHERE user_number IN (SELECT user_number FROM users WHERE device_id=$1)',[deviceId]);

}

//if you can find a way to change this to work for any number of flags
//please do. For the moment it will just set the location of 3 flags.
function createThreeFlags(teamId,flagLocations,grabRadius){
    var flagOneLat = flagLocations[0].latitude;
    var flagOneLong = flagLocations[0].longitude;
    var flagTwoLat = flagLocations[1].latitude;
    var flagTwoLong = flagLocations[1].longitude;
    var flagThreeLat = flagLocations[2].latitude;
    var flagThreeLong = flagLocations[2].longitude;
    return poolFile.pool.query('INSERT INTO flags (flag_location,grab_radius,team_id,flag_number,out_of_game) VALUES (POINT($3,$4),$2,$1,1,false),(POINT($5,$6),$2,$1,2,false),(POINT($7,$8),$2,$1,3,false)',[teamId,grabRadius,flagOneLat,flagOneLong,flagTwoLat,flagTwoLong,flagThreeLat,flagThreeLong])
}

function createOneFlag(teamId,flagLocations,grabRadius,flag_number){
    return poolFile.pool.query('INSERT INTO flags (flag_location,grab_radius,team_id,flag_number,out_of_game) VALUES (POINT($3,$4),$2,$1,$5,false)',[teamId,grabRadius,flagLocations[0].latitude,flagLocations[0].longitude,flag_number])
}

function removeFlagFromGame(flagId){
    return poolFile.pool.query('UPDATE flags SET out_of_game=true WHERE flag_id=$1',[flagId]);
}

function removeFlagFromPlayer(playerId){
    return poolFile.pool.query('UPDATE players SET flag_id=null WHERE player_id=$1',[playerId]);
}


//deletes a game
function deleteGame(gameId){
    return poolFile.pool.query('DELETE FROM games WHERE game_id=$1',[gameId]);
}

function deleteCoins(gameId){
    return poolFile.pool.query('DELETE FROM coins WHERE game_id=$1 and player_id is null',[gameId]);
}

//deletes all regions associated with a game id.
function deleteAllRegionsAssociatedWithGameId(gameId){
    return poolFile.pool.query('DELETE FROM regions WHERE region_id IN(SELECT region_id FROM game_infos WHERE game_id=$1 UNION SELECT region_id FROM teams WHERE game_id=$1)',[gameId])
}

function setGameStartTimeToNow(gameID){
    return poolFile.pool.query('UPDATE game_infos SET start_time_stamp=NOW(),current_round = current_round+1 WHERE game_id=$1',[gameID]);
}

//updates a specific teams Enemy ID.
function updateEnemyTeamId(teamId,enemyTeamId){
    return poolFile.pool.query('UPDATE teams SET enemy_team_id=$1 WHERE team_id=$2',[enemyTeamId,teamId])
}

//returns usernames and locations of all teammates, as well as whether they have a flag
function getAllTeammates(deviceId){
    return poolFile.pool.query('SELECT player_location,username,flag_id,is_eliminated,class,player_id FROM players WHERE team_id IN (SELECT team_id FROM players WHERE user_number IN (SELECT user_number FROM users WHERE device_id=$1))',[deviceId])
}

function getGameInfo(gameId){
    return poolFile.pool.query('SELECT * FROM game_infos WHERE game_id=$1',[gameId])
}

//gives you the locations of all of the flags that the enemy flag is currently holding, i.e. in your territory
//if none of the enemy players have any of your flags, returns an empty list.
function getLocationsOfHeldFlagsOnEnemyTeam(deviceId){
    return poolFile.pool.query('SELECT flag_id,player_location FROM players WHERE flag_id IS NOT NULL AND team_id IN (SELECT enemy_team_id FROM teams WHERE team_id IN (SELECT team_id FROM players WHERE user_number IN(SELECT user_number FROM users WHERE device_id=$1)))',[deviceId]);
}
function getLocationsOfHeldFlagsOnMyTeam(deviceId){
    return poolFile.pool.query('SELECT flag_id,player_location FROM players WHERE flag_id IS NOT NULL AND team_id IN (SELECT team_id FROM players WHERE user_number IN(SELECT user_number FROM users WHERE device_id=$1))',[deviceId]);
}
function getLocationsOfMyTeamsFlags(deviceId){
    return poolFile.pool.query('SELECT flag_id,flag_location,flag_number from flags where out_of_game=false AND team_id IN(SELECT team_id FROM players WHERE user_number IN(SELECT user_number FROM users WHERE device_id=$1))',[deviceId]);
}
function getLocationsOfEnemyFlags(deviceId){
    return poolFile.pool.query('SELECT flag_id,flag_location,flag_number from flags where out_of_game = false AND team_id IN(SELECT enemy_team_id FROM teams WHERE team_id IN (SELECT team_id FROM players WHERE user_number IN(SELECT user_number FROM users WHERE device_id=$1)))',[deviceId]);
}

function getFlagNumberFromPlayerId(playerId){
    return poolFile.pool.query('SELECT flag_number FROM flags WHERE out_of_game=false AND flag_id IN (SELECT flag_id FROM players WHERE player_id=$1)',[playerId]);
}

//teamID is the ENEMY team ID, so we need to swap it.
function getFlagWithFlagNumber(teamId,flagNumber){
    return poolFile.pool.query('SELECT * from flags WHERE flag_number=$2 AND out_of_game=false AND team_id IN (SELECT enemy_team_id FROM teams WHERE team_id=$1)',[teamId,flagNumber])
}

function getLocationsOfEnemies(deviceId){
    return poolFile.pool.query("SELECT player_location,username,flag_id,is_eliminated,class,player_id FROM players WHERE team_id IN (SELECT enemy_team_id FROM teams WHERE team_id IN (SELECT team_id FROM players WHERE user_number IN (SELECT user_number FROM users WHERE device_id=$1)))",[deviceId])
}

function getDeviceLocation(deviceId){
    return poolFile.pool.query("SELECT view_radius,player_location FROM players WHERE user_number IN (SELECT user_number FROM users WHERE device_id=$1)",[deviceId])
}

function getRegionOfTeamNumber(teamNumber,gameId){
    return poolFile.pool.query("SELECT corner1,corner2,corner3,corner4 FROM regions WHERE region_id IN (SELECT region_id FROM teams WHERE game_id=$1 AND team_number=$2)",[gameId,teamNumber])
}

function getGamesDeviceCreated(deviceId){
    return poolFile.pool.query("SELECT game_id FROM games WHERE user_number IN (SELECT user_number FROM users WHERE device_id=$1)",[deviceId]);
}


//sets flag with flagId: flagId, to belong to player with playerId: playerId
function setFlagBelongsToPlayerId(flagId,playerId){
    return poolFile.pool.query("UPDATE players SET flag_id=$1 WHERE player_id=$2",[flagId,playerId]);
}

function setflaglocation(flagId,latitude,longitude){
    return poolFile.pool.query('UPDATE flags SET flag_location = POINT($1,$2) WHERE flag_id=$3',[latitude,longitude,flagId]);
    //return poolFile.pool.query('UPDATE players SET player_location=POINT($1,$2) WHERE player_id=$3',[latitude,longitude,player_id]);
}

//assuming we know the enemy team ID, in this case 54
//SELECT flag_id,player_location from players where flag_id IS NOT NULL AND team_id=54;

function setPlayerEliminated(playerId){
    return poolFile.pool.query('UPDATE players SET is_eliminated=true, flag_id=null WHERE player_id=$1',[playerId]);
}

function getFlagsLeft(teamNumber,gameId){
    return poolFile.pool.query('SELECT COUNT(flag_id) AS flag_count FROM flags WHERE team_id IN (SELECT team_id FROM teams WHERE game_id=$1 AND team_number=$2) AND out_of_game=false',[gameId,teamNumber])
}

function getClockInfoAndNow(gameId){
    return poolFile.pool.query('SELECT NOW(), start_time_stamp,game_length FROM game_infos WHERE game_id=$1',[gameId]);
}

function setGameEnded(gameId){
    return poolFile.pool.query('UPDATE game_infos SET end_time_stamp=NOW() WHERE end_time_stamp IS NULL AND game_id=$1',[gameId]);
}

function updatePlayerClass(playerId,classId){
    return poolFile.pool.query('UPDATE players SET class=$1 WHERE player_id=$2',[classId,playerId]);
}

function updatePlayerViewAndTagRadius(playerId,viewRadius,tagRadius){
    return poolFile.pool.query('UPDATE players SET tag_radius=$1, view_radius=$2 WHERE player_id=$3',[tagRadius,viewRadius,playerId]);
}

function getEnemyFlagsFromTeamId(teamId){
    return poolFile.pool.query("SELECT * FROM flags WHERE team_id IN (SELECT enemy_team_id FROM teams WHERE team_id=$1)",[teamId]);
}

function assignQueenFlag(playerId,flagId){
    return poolFile.pool.query("INSERT INTO queens (flag_id,player_id) VALUES ($1,$2) ON CONFLICT (player_id) DO UPDATE SET flag_id=$1",[flagId,playerId]);
}

function getQueenFlagNumber(playerId){
    return poolFile.pool.query("SELECT flag_number FROM flags WHERE flag_id IN (SELECT flag_id FROM queens WHERE player_id=$1)",[playerId]);
}
function getQueenInfoFromFlagId(flagId){
    return poolFile.pool.query("SELECT * FROM queens WHERE flag_id=$1",[flagId]);
}
function getAllEnemyFlagsStillInGame(teamId){
    return poolFile.pool.query("SELECT * FROM flags WHERE team_id IN (SELECT enemy_team_id FROM teams WHERE team_id=$1) AND out_of_game=FALSE",[teamId]);
}

function createCoinForGame(gameId,latitude, longitude) {
    return poolFile.pool.query('INSERT INTO coins (game_id, coin_location,create_date) VALUES ($1, POINT($2,$3), NOW())', [gameId, latitude, longitude]);
}

function getCoinsFromGame(gameId){
    return poolFile.pool.query('SELECT * FROM coins WHERE game_id=$1 and player_id is null', [gameId])
}

function updateCoinForPlayer(coinId, playerId) {
    return poolFile.pool.query('UPDATE coins SET player_id=$1 WHERE coin_id=$2', [playerId, coinId]);
}

function getQueenPlayerIdFromDeviceAndUserName(deviceId, username) {
    return poolFile.pool.query('select player_id from players left join users on players.user_number=users.user_number where users.device_id=$1 and players.username=$2', [deviceId, username]);
}

function createCookieInGame(gameId,longitude,latitude,cookieType,cookieIdentifierNumber,cookieDuration){
        return poolFile.pool.query('INSERT INTO cookies (game_id,cookie_location,cookie_type,cookie_number,activation_length,player_id) VALUES ($1,POINT($3,$2),$4,$5,$6,null)',[gameId,longitude,latitude,cookieType,cookieIdentifierNumber, cookieDuration])
}
function setCookieAmountsForGame(gameId,cookieType,cookieAmount){
    return poolFile.pool.query('INSERT INTO cookie_amounts (game_id,cookie_type,cookie_amount) VALUES($1,$2,$3)',[gameId,cookieType,cookieAmount])
}
function deleteCurrentCookieAmountsFromGame(gameId){
    return poolFile.pool.query('DELETE from cookie_amounts WHERE game_id=$1',[gameId]);
}
function getCookieAmountsForGame(gameId){
    return poolFile.pool.query('SELECT cookie_type,cookie_amount from cookie_amounts WHERE game_id=$1',[gameId]);
}

function getAllCookiesInGame(gameId){
    return poolFile.pool.query('SELECT cookie_type,cookie_location,cookie_number,player_id,activation_length from cookies where game_id=$1',[gameId])
}
function getCookieFromGame(cookieNumber,gameId){
    return poolFile.pool.query('SELECT * FROM cookies WHERE game_id=$1 AND cookie_number=$2 AND player_id is null',[gameId,cookieNumber]);
}

//updates a cookie, saying that it belongs to a player
function updateCookieBelongsToPlayer(cookieId,playerId){
    return poolFile.pool.query('UPDATE cookies SET player_id=$2,activation_time_stamp=NOW() WHERE cookie_id=$1 RETURNING activation_length',[cookieId,playerId])
}

//get all cookies on a player whether they're active or not.
function getAllCookiesOnPlayer(playerId){
    return poolFile.pool.query('SELECT * FROM cookies WHERE player_id=$1',[playerId]);
}

//get all cookies belonging to player with a certain type.
function getCookiesOfPlayerOfType(playerId,cookieType){
    return poolFile.pool.query('SELECT * FROM cookies WHERE player_id=$1 AND cookie_type=$2',[playerId,cookieType]);
}

//methodType is POST,DELETE,etc.
function incrementQueryRequestAmount(queryPath,methodType){
    return poolFile.pool.query('INSERT INTO queries as Q (query_path,total_queries,last_called_at_timestamp,unique_name,request_method)VALUES ($1,1,NOW(),$2,$3) on conflict (unique_name) DO UPDATE SET total_queries = Q.total_queries + 1',[queryPath,queryPath + ' ' + methodType,methodType]);
}

module.exports={
    createGameInfoQuery,
    createGameQuery,
    createRegion,
    createUserQuery,
    createTeam,
    getUserNumberQuery,
    getUserWhoCreatedGame,
    getDeviceIdOfUser,
    getPlayerFromUserNumber,
    getPlayerFromUsername,
    getGameIds,
    getGameRegion,
    getTeamsWithGameId,
    getGamesDeviceCreated,
    updateRegion,
    updateGameInfo,
    updateEnemyTeamId,
    setTeamRegionId,
    getDefaultRadiusesFromGame,
    createPlayer,
    createOneFlag,
    getRegionOfTeam,
    createThreeFlags,
    updatePlayerLocation,
    getGameIdOfDeviceId,
    getUsersInGameId,
    getTeamCountAndColor,
    getAllTeammates,
    getGameInfo,
    getGameIDUserCreated,
    getEnemyFlagsFromTeamId,
    setGameStartTimeToNow,
    checkIfGameHasRegion,
    checkIfTeamHasRegion,
    deleteGame,
    deleteAllRegionsAssociatedWithGameId,
    getLocationsOfHeldFlagsOnEnemyTeam,
    getLocationsOfHeldFlagsOnMyTeam,
    getLocationsOfMyTeamsFlags,
    getLocationsOfEnemyFlags,
    getLocationsOfEnemies,
    getDeviceLocation,
    getRegionOfTeamNumber,
    getPlayerInfoFromDeviceId,
    getFlagNumberFromPlayerId,
    getFlagWithFlagNumber,
    setFlagBelongsToPlayerId,
    setPlayerEliminated,
    removeFlagFromGame,
    getFlagsLeft,
    getClockInfoAndNow,
    setGameEnded,
    getGameRegionFromTeamId,
    removeFlagFromPlayer,
    updatePlayerClass,
    updatePlayerViewAndTagRadius,
    assignQueenFlag,
    getQueenFlagNumber,
    getQueenInfoFromFlagId,
    getAllEnemyFlagsStillInGame,
    createCoinForGame,
    getCoinsFromGame,
    deleteCoins,
    updateCoinForPlayer,
    getQueenPlayerIdFromDeviceAndUserName,
    createCookieInGame,
    setCookieAmountsForGame,
    getCookieAmountsForGame,
    deleteCurrentCookieAmountsFromGame,
    getAllCookiesInGame,
    getCookieFromGame,
    updateCookieBelongsToPlayer,
    getAllCookiesOnPlayer,
    getCookiesOfPlayerOfType,
    incrementQueryRequestAmount,
    updateEliminatedAndFlagStatus,
    setflaglocation
}
