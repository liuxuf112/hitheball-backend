const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const regionCalcs = require("../helpers/regionCalculations")



async function createTeamRegions(httpRequest,httpResponse,gameId,teamOneId,teamTwoId,divideByLatitude){
    //hard math part here.... calculating team regions.
    var regionXY;
    try{
        var res = await queries.getGameRegion(gameId);
        regionXY = res.rows[0];
    }catch(err){
        errors.handleServerError("getGameRegion",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    var teamRegions;
    if(divideByLatitude){
        teamRegions = regionCalcs.splitRegionInHalfLatitude(regionCalcs.convertXYRegiontoLatLon(regionXY)) //creating the individual team regions
    }else{
        teamRegions = regionCalcs.splitRegionInHalfLongitude(regionCalcs.convertXYRegiontoLatLon(regionXY)) //creating the individual team regions
    }
  
   
    var result = await updateOrCreateTeamRegion(httpRequest,httpResponse,teamOneId,teamRegions[0]);
    if(result == errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE;
    }
    result = await updateOrCreateTeamRegion(httpRequest,httpResponse,teamTwoId,teamRegions[1]);
    if(result == errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE;   
    }
    return 0;
    

}

async function updateOrCreateTeamRegion(httpRequest,httpResponse,teamId,region){
    //first we do team one
    var team;
    try{
        var res = await queries.checkIfTeamHasRegion(teamId);
        if(res.rows.length > 1){
            errors.handleServerError(`too many teams in checkIfTeamHasRegion: ${teamId}`,httpResponse,err);
            return errors.ASYNC_FAILURE;
        }else{
            team = res.rows[0];
        }
    }catch(err){
        errors.handleServerError("checkifTeamHasRegion",httpResponse,err);
    }

    if(team.region_id != null){  //if the region already exists
        var regionId = team.region_id;
        try{
            await queries.updateRegion(regionId,region);
        }catch(err){
            errors.handleServerError("updateRegion",httpResponse,err);
            return errors.ASYNC_FAILURE
        }
    }else{ //the team doesn't exist yet

        //first we create the region
        var regionId;
        try{
            var res = await queries.createRegion(region);
            regionId = res.rows[0].region_id;            
        }catch(err){
            errors.handleServerError("createRegion",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }

        //then we create set the team region to be the created region
        try{
            await queries.setTeamRegionId(teamId,regionId);
        }catch(err){
            errors.handleServerError("setTeamRegionId",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
        
    }
    return 0;
}







module.exports = {
    createTeamRegions
}