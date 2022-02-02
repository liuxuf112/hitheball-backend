

class Point{
    constructor(lat,long){
        this.lat = lat;
        this.long = long;
    }
};






//Returns whether 2 points are within distance of eachother. Distance is in meters
function checkIfPointsWithinDistance(lat1,lon1, lat2, lon2,distance)
{
  
    let p1 = new Point(lat1,lon1);
    let p2 = new Point(lat2,lon2);
   
    return distanceBetweenPoints(p1,p2) <=distance;
 

}

module.exports = {
    checkIfPointsWithinDistance,
    queryIfPointInRectangle
}

function distanceBetweenPoints(p1, p2){
    lon1 = p1.long;
    lon2 = p2.long;
    lat1 = p1.lat;
    lat2 = p2.lat;
    lon1 =  lon1 * Math.PI / 180;
    lon2 = lon2 * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;

    // Haversine formula
    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.pow(Math.sin(dlat / 2), 2)
                + Math.cos(lat1) * Math.cos(lat2)
                * Math.pow(Math.sin(dlon / 2),2);
            
    let c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956
    // for miles
    let r = 6371;
    return (c*r)*1000;  //returns in meters the distance.
}



//regionPoints is a list of latlong coord pairs.
function queryIfPointInRectangle(query,regionPoints) {
    let lat1 = regionPoints[0].latitude;
    let lat2 = regionPoints[1].latitude;
    let lat3 = regionPoints[2].latitude;
    let lat4 = regionPoints[3].latitude;
    let latMin = Math.min(lat1,lat2,lat3,lat4);
    let latMax = Math.max(lat1,lat2,lat3,lat4);
    let long1 = regionPoints[0].longitude;
    let long2 = regionPoints[1].longitude;
    let long3 = regionPoints[2].longitude;
    let long4 = regionPoints[3].longitude;
    let longMin = Math.min(long1,long2,long3,long4);
    let longMax = Math.max(long1,long2,long3,long4);
    if(query.latitude <= latMax && query.latitude >= latMin && query.longitude <= longMax && query.longitude >= longMin) {
        return true;
    } else {
        return false;
    }
}

// let po = new Point(-11,0);
// let po1 = new Point(10,10);
// let po2 = new Point(-10,10);
// let po3 = new Point(-10,-10);
// let po4 = new Point(10,-10);
// console.log(queryIfPointInRectangle(po,po1,po2,po3,po4));
