
const queries = require("../helpers/Queries");
const errors = require("../helpers/Errors");
const randoms = require("../helpers/randoms");


//returns 0 on success, -1 otherwise
//cookie amount list looks like this [0,1,2] where each index is the cookie type, and each value is the amount of that type
async function initializeCookieAmounts(httpRequest,httpResponse,cookieAmountsList,gameID){
    try{
        await queries.deleteCurrentCookieAmountsFromGame(gameID);
    }catch(err){
        errors.handleServerError("deleteCurrentCookieAmountsFromGame",httpResponse,err);
        return errors.ASYNC_FAILURE;
    }

    for(var cookieAmountIndex = 0; cookieAmountIndex < cookieAmountsList.length; cookieAmountIndex++){
        try{
            await queries.setCookieAmountsForGame(gameID,cookieAmountIndex,cookieAmountsList[cookieAmountIndex]);
        }catch(err){
            errors.handleServerError("setCookieAmountsForGame",httpResponse,err);
            return errors.ASYNC_FAILURE;
        }
    }

    return 0;
}

module.exports = {
    initializeCookieAmounts
}