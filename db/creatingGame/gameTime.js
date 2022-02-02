module.exports = {
    setGameStartTime
}

const errors = require("../helpers/Errors")
const queries = require("../helpers/Queries")



//sets the game start time in game_infos, and returns the request
//letting the user who requested it know that the game has started.
async function setGameStartTime(httpRequest,httpResponse,gameID){
    try{
        await queries.setGameStartTimeToNow(gameID);
    }catch(err){
        errors.handleServerError("setGameStartTime",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }
    return 0;
}


