

const queries = require("../helpers/Queries");
const regionCalcs = require("../helpers/regionCalculations")
const random = require("../helpers/randoms")
const errors = require('../helpers/Errors');

const generateCoinForGame = async (httpRequest, httpResponse)=>{

    var gameId = httpRequest.body.gameId;
    var amount = httpRequest.body.amount;
    if(gameId == null || amount == null){
        console.error(`generateCoins with gameId: ${gameId} and amount: ${amount} submitted an invalid request to generateCoins`);
        httpResponse.status(400).send("Bad Request");
        return;
    }
    var regionXY;
    try{
        var res = await queries.getGameRegion(gameId);
        if (res.rows.length === 0) {
            httpResponse.status(400).send("Bad Request");
            return;
        }
        regionXY = res.rows[0];
    }catch(err){
        errors.handleServerError("getGameRegion",httpResponse,err);
        return;
    }
    var gameCurrencyLocations = generateCoinLocations(amount,regionXY);
    for(var i = 0; i < amount; ++i) {
        try{
            await queries.createCoinForGame(gameId, gameCurrencyLocations[i].latitude, gameCurrencyLocations[i].longitude);
        }catch(err){
            errors.handleServerError("createCurrency",httpResponse,err);
            return;
        }

    }
    httpResponse.status(200).send(JSON.stringify(gameCurrencyLocations))

}

const getCoinsFromGame = async (httpRequest,httpResponse)=>{
    var gameId = httpRequest.query.gameId;
    if(gameId == null){
        console.error(`getCoinsFromGame with gameId: ${gameId} submitted an invalid request to getCoinsFromGame`);
        httpResponse.status(400).send("Bad Request")
        return;
    }
    try{
        var res = await queries.getCoinsFromGame(gameId);
        httpResponse.status(200).send(JSON.stringify(res.rows))
    }catch(err){
        errors.handleServerError("getCoinsFromGame",httpResponse,err);
    }
}



function generateCoinLocations(amount,region){
    var latLongRegion = regionCalcs.convertXYRegiontoLatLon(region);
    var minsAndMaxs = regionCalcs.getMaxsAndMins(latLongRegion);
    var coinLocations = [];
    for(var i = 0; i < amount; ++i){
        var coinLat = random.getRandomArbitrary(minsAndMaxs.minLat,minsAndMaxs.maxLat);
        var coinLong = random.getRandomArbitrary(minsAndMaxs.minLong,minsAndMaxs.maxLong);
        coinLocations.push({latitude:coinLat,longitude:coinLong})
    }
    return coinLocations;


}

module.exports = {
    generateCoinForGame,
    getCoinsFromGame
}
