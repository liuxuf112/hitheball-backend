
function getMaxsAndMins(region){
    
    var minLat = 90;
    var maxLat = -90;
    var minLong = 180;
    var maxLong = -180;
    for(var i = 0; i < region.length; i++){
        if(region[i].latitude < minLat){
            minLat = region[i].latitude;
        }
        if(region[i].latitude > maxLat){
            maxLat = region[i].latitude;
        }
        if(region[i].longitude < minLong){
            minLong = region[i].longitude;
        }
        if(region[i].longitude > maxLong){
            maxLong = region[i].longitude;
        }
    }
    return{
        minLat:minLat,
        maxLat:maxLat,
        minLong:minLong,
        maxLong:maxLong
    }
}
//splits a region into two halfs, based on the latitudes and longitudes.
//divides down the "middle" considering the longitude
function splitRegionInHalfLongitude(region){
    maxesAndMins = getMaxsAndMins(region);
    maxLat = maxesAndMins.maxLat;
    minLat = maxesAndMins.minLat;
    maxLong = maxesAndMins.maxLong;
    minLong = maxesAndMins.minLong;
    leftRegion = [
        {
            latitude:maxLat,
            longitude:minLong    //top left point
        },
        {
            latitude: minLat,
            longitude: minLong   //bottom left point
        },
        {   //top right point
            latitude: maxLat,
            longitude: (minLong + maxLong) / 2
        },
        {
            latitude: minLat,
            longitude: (minLong + maxLong) / 2
        }
    ]
    rightRegion = [
        {
            latitude:maxLat,
            longitude:maxLong    //top right point
        },
        {
            latitude: minLat,
            longitude: maxLong   //bottom right point
        },
        {   //top left point
            latitude: maxLat,
            longitude: (minLong + maxLong) / 2
        },
        {   //bottom right point
            latitude: minLat,
            longitude: (minLong + maxLong) / 2
        }
    ]
    return [
         leftRegion,
         rightRegion
    ]
}
function splitRegionInHalfLatitude(region){
    maxesAndMins = getMaxsAndMins(region);
    maxLat = maxesAndMins.maxLat;
    minLat = maxesAndMins.minLat;
    maxLong = maxesAndMins.maxLong;
    minLong = maxesAndMins.minLong;
    topRegion = [
        {
            latitude:maxLat,
            longitude:minLong   //top left point
        },
        {
            latitude: (minLat+maxLat)/2,
            longitude: minLong   //bottom left point
        },
        {   //top right point
            latitude: maxLat,
            longitude: maxLong
        },
        {
            latitude: (minLat+maxLat)/2,
            longitude: maxLong
        }
    ]
    bottomRegion = [
        {
            latitude:(maxLat+minLat)/2,
            longitude:minLong   //top left point
        },
        {
            latitude: minLat,
            longitude: minLong  //bottom left point
        },
        {   //top right point
            latitude: (maxLat+minLat)/2,
            longitude: maxLong
        },
        {   //bottom right point
            latitude: minLat,
            longitude: maxLong
        }
    ]
    return [
      topRegion,
        bottomRegion
    ]
}

//converts something like this:
/*
{
  corner1: { x: 1, y: 2 },
  corner2: { x: 1, y: 2 },
  corner3: { x: 1, y: 2 },
  corner4: { x: 1, y: 3 }
}
 to this
 [
  { latitude: 1, longitude: 2 },
  { latitude: 1, longitude: 2 },
  { latitude: 1, longitude: 2 },
  { latitude: 1, longitude: 3 }
]

 */
function convertXYRegiontoLatLon(regionXY){
    latLongRegion = [{
        latitude:regionXY.corner1.x,
        longitude:regionXY.corner1.y
    },{
        latitude:regionXY.corner2.x,
        longitude:regionXY.corner2.y
    },{
        latitude:regionXY.corner3.x,
        longitude:regionXY.corner3.y
    },{
        latitude:regionXY.corner4.x,
        longitude:regionXY.corner4.y
    }];
    return latLongRegion;
}


module.exports = {
    getMaxsAndMins,
    convertXYRegiontoLatLon,
    splitRegionInHalfLatitude,
    splitRegionInHalfLongitude
}