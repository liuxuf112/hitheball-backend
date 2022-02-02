
const errors = require("./Errors");
const queries = require("./Queries");
const TimeHelper = require("./TimeHelper");
const cookieTypes = require("./CookieConstants");
async function isPlayerInvisible(httpRequest,httpResponse,playerId){
    var invisibleCookies;
    try {
        var res = await queries.getCookiesOfPlayerOfType(playerId, cookieTypes.cookieTypesEnum.INVISIBLE_COOKIE_TYPE);
        invisibleCookies = res.rows;
    } catch (err) {
        errors.handleServerError("getCookiesOfPlayerOfType", httpResponse, err);
        return errors.ASYNC_FAILURE;
    }
    for (const cookie of invisibleCookies) {
        if (TimeHelper.howLongAgoWas(cookie.activation_time_stamp) < cookie.activation_length) { //then you can't tag the player, they're still invisible
            return true;
        }
    }
    return false;
}


module.exports = {
    isPlayerInvisible
}