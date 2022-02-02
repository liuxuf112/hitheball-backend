const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const getGameInfo = require("./getGameInfo");
const coordCalculations = require("../helpers/coordinateCalculations");
const regionCalculations = require("../helpers/regionCalculations");
const classesFile = require("../helpers/Classes");
const {
    cookieTypesEnum
} = require("../helpers/CookieConstants");
const  playerInvisible  = require("../helpers/isPlayerInvisible");
//should be a get request, to attempt to steal flag.
const attemptTagPlayer = (httpRequest, httpResponse) => {
    getGameInfo.checkIfDeviceMatchesGameID(httpRequest, httpResponse, tryToTagPlayer, "attempTagPlayer")
}


async function tryToTagPlayer(httpRequest, httpResponse, gameId, deviceId) {
    var enemyUsername = httpRequest.query.enemyUsername;
    if (!enemyUsername) {
        console.error("attempt tag player called without player username");
        httpResponse.status(400).send("bad request");
        return;
    }

    var player; //the player that we are.
    var playerToTag; //the player we will attempt to tag

    //try to get the player info from our deviceId
    try {
        var res = await queries.getPlayerInfoFromDeviceId(deviceId);
        player = res.rows[0];
    } catch (err) {
        errors.handleServerError("getPlayerInfoFromDeviceId", httpResponse, err);
        return;
    }

    //if we're a king, we can't tag players. We get the class name.
    var classString = classesFile.classNames[player.class];
    if (classString === "King") {
        console.error(`Player: ${player.username} attempted to tag while being a king`);
        httpResponse.status(403).send("You cannot tag enemy players, you are a king!");
        return;
    }

    //see if the enemy player we're trying to tag exists in our game.
    try {
        var res = await queries.getPlayerFromUsername(enemyUsername, gameId);
        if (res.rows.length == 0) {
            console.error(`player: ${player.username} attempted to tag a player that doesn't exist: ${enemyUsername}`)
            httpResponse.status(400).send("That player doesn't exist!");
            return;
        } else if (res.rows.length > 1) {
            console.error(`In game: ${gameId} there are 2 players with the username: ${enemyUsername}`)
            httpResponse.status(500).send("Internal Server Error");
            return;
        } else {
            playerToTag = res.rows[0];
        }
    } catch (err) {
        errors.handleServerError("getPlayerFromUsername", httpResponse, err);
        return;
    }
    var enemyClassString = classesFile.classNames[playerToTag.class];
    //You can't tag a knight
    if (enemyClassString === "Knight") {
        console.error(`Player: ${player.username} attempted to tag a knight: ${playerToTag.username}`);
        httpResponse.status(403).send("You cannot tag a knight!");
        return;
    }

    //if you or the player you are attempting to tag is eliminated, you cannot tag them.
    //also if one of you doesn't have your location set... you can't tag them. ALSO IF THE PLAYER IS ON YOUR TEAM
    //you cannot tag them
    if (player.is_eliminated) {
        console.error(`player: ${player.username} attempted to tag a player while eliminated!`)
        httpResponse.status(400).send("You cannot tag a player while eliminated");
        return;
    } else if (playerToTag.is_eliminated) {
        console.error(`player: ${player.username} attempted to tag a player ${playerToTag.username} swho is already eliminated`)
        httpResponse.status(400).send("You cannot tag a player who is already eliminated");
        return;
    } else if (!player.player_location) {
        console.error(`player: ${player.username} attempted to tag without location set!`);
        httpResponse.status(400).send("You cannot tag without your location set!");
        return;
    } else if (!playerToTag.player_location) {
        console.error(`player: ${player.username} attempted to tag player: ${playerToTag.username} without location set!`);
        httpResponse.status(400).send("You cannot tag a player that does not have their location set!");
        return;
    } else if (playerToTag.team_id == player.team_id) {
        console.error(`player: ${player.username} attempted to tag player: ${playerToTag.username} on their own team`);
        httpResponse.status(400).send("You can't tag a player on your own team");
        return;
    }


    //now we get our team zone (we have to be in our team zone to tag a player)
    var myTeamRegion;
    try {
        var res = await queries.getRegionOfTeam(player.team_id);
        myTeamRegion = res.rows[0];
    } catch {
        errors.handleServerError("getRegionOfTeam", httpResponse, err);
        return;
    }

    //converting x y into latLon list. 
    var latLongTeamRegion = regionCalculations.convertXYRegiontoLatLon(myTeamRegion);
    var playerLocation = {
        latitude: player.player_location.x,
        longitude: player.player_location.y
    }
    var playerToTagLocation = {
        latitude: playerToTag.player_location.x,
        longitude: playerToTag.player_location.y
    }

    //if you are in the enemy zone you cannot tag an enemy.
    //if the enemy team player is not in your zone.
    var isPlayerInTheirTeamRegion = coordCalculations.queryIfPointInRectangle(playerLocation, latLongTeamRegion);
    var isEnemyInYourTeamRegion = coordCalculations.queryIfPointInRectangle(playerToTagLocation, latLongTeamRegion);
    if (!isPlayerInTheirTeamRegion) {
        console.error(`player: ${player.username} attempted to tag player: ${playerToTag.username} while in the enemy team region`);
        httpResponse.status(400).send("You can't tag a player while not in your team's zone!");
        return;
    } else if (!isEnemyInYourTeamRegion) {
        console.error(`player: ${player.username} attempted to tag player: ${playerToTag.username} while that player was not in their zone`);
        httpResponse.status(400).send("You can't tag a player who is in their zone!");
        return;
    }

    //then we need to check if that player is invisible. If so, how did you try to tag them?
    var isPlayerInvisible = await playerInvisible.isPlayerInvisible(httpRequest,httpResponse,playerToTag.player_id);
    if(isPlayerInvisible){
        console.error(`player:> ${player.username} attempted to tag an invisible player: ${playerToTag.username}`);
        httpResponse.status(400).send("You can't tag an invisible player!");
        return;
    }

    //finally we need to check if you're close enough to the player to tag them.
    var areYouCloseEnough = coordCalculations.checkIfPointsWithinDistance(playerLocation.latitude, playerLocation.longitude, playerToTagLocation.latitude, playerToTagLocation.longitude, player.tag_radius);
    var sendBody = {
        playerTagged: false
    }
    if (areYouCloseEnough == false) {
        console.error(`player: ${player.username} attempted to tag player: ${playerToTag.username} but the player was too far away`)
        httpResponse.status(200).send(JSON.stringify(sendBody)); //the reason we send a body for this one is this could happen legally, the player is just too far away.
        //send body makes it easier for front end to parse.
        return;
    } else {
        sendBody.playerTagged = true;
    }

    //now we update the playerTagged status in the database.
    try {
        var res = await queries.setPlayerEliminated(playerToTag.player_id);
    } catch {
        errors.handleServerError("setPlayerEliminated", httpResponse, err);
    }

    httpResponse.status(200).send(JSON.stringify(sendBody));

}




module.exports = {
    attemptTagPlayer
}