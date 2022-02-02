


//returns how many seconds ago the time stamp was
//time stamp in this format: 2022-01-27 05:19:09.433024+00
function howLongAgoWas(time_stamp){
    
    var date = new Date(String(time_stamp));
    var dateMilliseconds = date.getTime();
    var currDate = Date.now()
    var millisecondsDifference = currDate - dateMilliseconds;
    var secondsDifference = millisecondsDifference / 1000;
    return secondsDifference;
}

module.exports = {howLongAgoWas}