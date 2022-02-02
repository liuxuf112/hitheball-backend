const queries = require('./Queries');
const errors = require('./Errors');


//gets the user from a deviceId.
//returns -1 on failure,
//returns user number otherwise
async function getUser(httpResponse,deviceId){
    var usersWithDeviceId;
    try{
        //we try to get the user number for a deviceID
        var res = await queries.getUserNumberQuery(deviceId);
        usersWithDeviceId = res.rows;
    }catch(err){
        errors.handleServerError("getUserNumberQuery",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    
    if(usersWithDeviceId.length == 0){  //if no user exists yet with this deviceID
        try{
            var res = await queries.createUserQuery(deviceId);
            return res.rows[0].user_number;
        }catch(err){
            errors.handleServerError("createUserQuery",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
    }else if(usersWithDeviceId.length > 1){ //if more than one user exists with the deviceID.
        console.error(`Too many users in database with deviceID:${deviceId}, getUserNumberQuery`);
        httpResponse.status(500).send("Internal Server Error");
        return errors.ASYNC_FAILURE;
    }else{  //else we're good
        return usersWithDeviceId[0].user_number;
    }
}
module.exports = {
    getUser
}