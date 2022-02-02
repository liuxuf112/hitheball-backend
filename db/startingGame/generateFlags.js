

//takes in a number and generates that amount of flags per team,

const errors = require("../helpers/Errors")
const queries = require("../helpers/Queries")

const random = require("../helpers/randoms")
const regionCalculations = require("../helpers/regionCalculations")
const teamsCalcs = require("../creatingGame/Teams");
//randomly placed throughout their region.
const DEFAULTGRABRADIUS=10; //default grab radius is 10 meters.
const DEFAULTAMOUNTOFFLAGS=3;

async function generateFlagsForTeam(httpResponse,teamID,flagsToGenerate){
    var teamRegion
    try{
        var res = await queries.getRegionOfTeam(teamID);
        teamRegion = res.rows[0];
    }catch(err){
        errors.handleServerError("getRegionOfTeam",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    
    for(var i = 0; i < flagsToGenerate; i++){
        var teamFlagLocations = generateFlagLocations(1,teamRegion);
        try{
            await queries.createOneFlag(teamID,teamFlagLocations,DEFAULTGRABRADIUS,i);
        }catch(err){
            errors.handleServerError("createOneFlag",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
    }
   
    return 0;
}

async function generateFlagsForAllTeams(httpRequest,httpResponse,gameID,flagsPerTeam){
    var teams;
    try{    //gets all teams in the current game
        var res = await queries.getTeamsWithGameId(gameID);
        teams = res.rows;
    }catch(err){
        errors.handleServerError("getTeamsWithGameId",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    
    var teamIds = teamsCalcs.getTeamIds(res.rows);  //get the teamIDS out
    var result;
    result = await generateFlagsForTeam(httpResponse,teamIds["teamOneId"],flagsPerTeam)
    if(result == errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE;
    }
    result = await generateFlagsForTeam(httpResponse,teamIds["teamTwoId"],flagsPerTeam);
    if(result == errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE;
    }
    return 0;
   
}





//takes in an XY region from the teams table.

function generateFlagLocations(amountOfFlags,region){
    var latLongRegion = regionCalculations.convertXYRegiontoLatLon(region);
    var minsAndMaxs = regionCalculations.getMaxsAndMins(latLongRegion);
    var flagLocations = [];
    for(var i = 0; i < amountOfFlags; ++i){
        var flagLat = random.getRandomArbitrary(minsAndMaxs.minLat,minsAndMaxs.maxLat);
        var flagLong = random.getRandomArbitrary(minsAndMaxs.minLong,minsAndMaxs.maxLong);
        flagLocations.push({latitude:flagLat,longitude:flagLong})
    }
    return flagLocations;


}

module.exports = {
    generateFlagsForAllTeams
}