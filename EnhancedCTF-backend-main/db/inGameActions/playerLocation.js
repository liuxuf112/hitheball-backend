
const coordCalcs = require("../helpers/coordinateCalculations");
const regionCalcs = require("../helpers/regionCalculations");
const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const randoms = require("../helpers/randoms");

//takes in a post request that looks like this
/*
    deviceID: ....
    latitude: ....
    longitude: ....


*/



const updatePlayerLocation = async (httpRequest,httpResponse)=>{
    var deviceId = httpRequest.body.deviceId;
    var newLatitude = httpRequest.body.latitude;
    var newLongitude = httpRequest.body.longitude;
    //validating body
    if(newLatitude == null || newLongitude == null){
        console.error(`user with deviceId:${deviceId} attempted to update location with invalid body latitude: ${newLatitude} longitude: ${newLongitude}`);
        httpResponse.status(400).send("Bad Request");
        return;
    }
    if(Number.isNaN(newLatitude) || Number.isNaN(newLongitude)){
       console.error(`user with deviceId:${deviceId} attempted to update location with NAN body latitude: ${newLatitude} longitude: ${newLongitude}`);
        httpResponse.status(400).send("Bad Request");
        return;
    }else if(Math.abs(newLatitude) > 90 ||  Math.abs(newLongitude) > 180 ){   //checking values of lat and long
       console.error(`user with deviceId:${deviceId} attempted to update location with out of range latitude: ${newLatitude} longitude: ${newLongitude}`);
        httpResponse.status(400).send("Bad Request");
        return;
    }
    //First we check if the deviceId requested has a user associated with it
    var userNumbersWithDeviceId;
    try{    //get user number associated with deviceId
        var res = await queries.getUserNumberQuery(deviceId);
        userNumbersWithDeviceId = res.rows;
    }catch(err){
        errors.handleServerError("getUserNumberQuery",httpResponse,err);
        return;
    }
    if(userNumbersWithDeviceId.length == 0){
        console.error("deviceId: " + deviceId + " attempted to update location without a user");
        httpResponse.status(400).send("Bad Request")
        return;
    }else if(userNumbersWithDeviceId.length > 1){   //should not be possible according to our database
        console.error("User with deviceID: " + deviceId + " has more than one user!");
        httpResponse.status(500).send("Internal Server Error")
        return;
    }

    //at this point we know there is only one item in the rows.
    var playersWithUserNumber;  //will hold all the players with a given user number
    try{
        var res = await queries.getPlayerFromUserNumber(userNumbersWithDeviceId[0].user_number);
        playersWithUserNumber = res.rows;
    }catch(err){
        errors.handleServerError("getPlayerFromUserNumber",httpResponse,err);
        return;
    }
    if(playersWithUserNumber.length == 0){
        console.error("user: " + userNumbersWithDeviceId[0].user_number + " attempted to update location without a player");
        httpResponse.status(506).send("No Player"); //506 because I need it to be unique
        return;
    }else if(playersWithUserNumber.length > 1){
        console.error("User with user_number: " + userNumbersWithDeviceId[0].user_number + " has more than one player");
        httpResponse.status(500).send("Internal Server Error");
        return;
    }
    var player = playersWithUserNumber[0];

    //else there's just one player id
    var player_id = player.player_id;
    
   
    try{
        //query can probably be renamed but this is the only time it's called soooooo
        //flaglocation x y
        //new flag x2 y2
        await queries.updatePlayerLocation(player_id,newLatitude,newLongitude);
    }catch(err){
        errors.handleServerError("updatePlayerLocation",httpResponse,err);
        return;
    }
    httpResponse.status(200).send("Location Successfully Updated");
    

             
        

}







module.exports ={
    updatePlayerLocation
} 