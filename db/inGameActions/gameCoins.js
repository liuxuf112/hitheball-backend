
const queries = require("../helpers/Queries");
const errors = require('../helpers/Errors');

const playerGetGameCoin = async (httpRequest,httpResponse)=>{
    var coinId = httpRequest.query.coinId;
    var deviceId = httpRequest.query.deviceId;
    var username = httpRequest.query.username;
    if(coinId == null || deviceId == null || username == null){
        console.error(`playerGetGameCoin with coinId: ${coinId} and deviceId: ${deviceId} and username: ${username} submitted an invalid request to playerGetGameCoin`);
        httpResponse.status(400).send("Bad Request");
        return;
    }
    var playerId;
    try{
        var res = await queries.getQueenPlayerIdFromDeviceAndUserName(deviceId, username);
        if (res.rows.length === 0) {
            httpResponse.status(400).send("Bad Request");
            return;
        }
        playerId = res.rows[0]['player_id'];
    }catch(err){
        errors.handleServerError("playerGetGameCoin",httpResponse,err);
        return;
    }

    try{
        await queries.updateCoinForPlayer(coinId, playerId);
    }catch(err){
        errors.handleServerError("playerGetGameCoin",httpResponse,err);
        return;
    }
    httpResponse.status(200).send("get a coin")

}


module.exports = {
    playerGetGameCoin
}
