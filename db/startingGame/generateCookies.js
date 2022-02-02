
const queries = require("../helpers/Queries");
const regionCalculations = require("../helpers/regionCalculations")
const random = require("../helpers/randoms")
const errors = require('../helpers/Errors');

//cookie types
//0: Increase view radius
//1: increase tag radius:
//2: invisible
const DEFAULT_COOKIE_DURATION = 30; //in seconds

//generates cookies for a game with cookieAmountList looking like this [0,1,2] where 
//index 0 is increase view, etc. 
//returns -1 on failure, 0 otherwise.
const generateCookiesForGame = async (httpRequest, httpResponse,gameId)=>{
    var cookieAmountList = await getCookieAmountList(httpRequest,httpResponse,gameId);
    if(cookieAmountList == errors.ASYNC_FAILURE){
        return errors.ASYNC_FAILURE;
    }
    //first we get the game region
    var gameRegion;
    try{
        var res = await queries.getGameRegion(gameId);
        gameRegion = res.rows[0];
    }catch(err){
        errors.handleServerError("getGameRegion",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    var latLongRegion = regionCalculations.convertXYRegiontoLatLon(gameRegion);
    var minsAndMaxs = regionCalculations.getMaxsAndMins(latLongRegion);
    //looping over all the types of cookies.
    var cookieIdentifierNumber = 0;
    for(var cookieListIndex = 0; cookieListIndex < cookieAmountList.length; cookieListIndex++){
        //for each cookie of a certain type
        for(var cookieNumber = 0; cookieNumber < cookieAmountList[cookieListIndex]; cookieNumber++){
            //generating cookie location.
            var cookieLat = random.getRandomArbitrary(minsAndMaxs.minLat,minsAndMaxs.maxLat);
            var cookieLong = random.getRandomArbitrary(minsAndMaxs.minLong,minsAndMaxs.maxLong);
            try{
                //create one cookie.
                var res = await queries.createCookieInGame(gameId,cookieLong,cookieLat,cookieListIndex,cookieIdentifierNumber,DEFAULT_COOKIE_DURATION);
            }catch(err){
                errors.handleServerError("createCookieInGame",httpResponse,err);
                return errors.ASYNC_FAILURE;
            }
            cookieIdentifierNumber+=1;
        }
    }
    
    return 0;

}
const getCookieAmountList = async (httpRequest, httpResponse,gameId)=>{
    var cookieAmountsList;
    try{
        var res = await queries.getCookieAmountsForGame(gameId);
        cookieAmountsList = res.rows;
    }catch(err){
        errors.handleServerError("getCookieAmountsForame",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }

    var cookieList = [];
    var currentFillingIndex = 0;
    while(cookieAmountsList.length > 0){
        for(var index = 0; index < cookieAmountsList.length; index++){
            if(cookieAmountsList[index].cookie_type == currentFillingIndex){
                cookieList.push(cookieAmountsList[index].cookie_amount);
                cookieAmountsList.splice(index,1);
                currentFillingIndex += 1;
                break;  //break out of for loop
            }
        }
    }
    return cookieList;

}


module.exports ={
    generateCookiesForGame
}