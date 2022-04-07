export function convertGeoToPixel(
    latitude,
    longitude,
    // mapWidth = 1833, // in pixels 1583
    // mapHeight = 909, // in pixels 909
    // mapLonLeft = -78.864095, // in degrees
    // mapLonDelta = -78.859849 + 78.864095, // in degrees (mapLonRight - mapLonLeft);
    // mapLatBottom = 38.43247, // in degrees
    // mapLatBottomDegree = (38.43247 * Math.PI) / 180,



    // New Map UpperLeft Corner 38.443381, -78.877518
    // New Map UpperRight Corner - 38.443381, -78.856997
    // New Map BottomLeft Corner - 38.429160, -78.877518
    
    mapWidth = 15351, // in pixels 15351
    mapHeight = 13543, // in pixels 13543
    mapLonLeft = -78.877518, // in degrees
    mapLonDelta = -78.856997 - mapLonLeft, // in degrees (mapLonRight - mapLonLeft)
    mapLatBottom = 38.429160, // in degrees
    mapLatBottomDegree = (mapLatBottom * Math.PI) / 180
    

// ) {
//     // in Radians
//     var x = (longitude - mapLonLeft) * (mapWidth / mapLonDelta)

//     latitude = (latitude * Math.PI) / 180
//     var worldMapWidth = ((mapWidth / mapLonDelta) * 360) / (2 * Math.PI)
//     var mapOffsetY =
//         (worldMapWidth / 2) * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree)))
//     var y =
//         mapHeight - ((worldMapWidth / 2) * Math.log((1 + Math.sin(latitude)) / (1 - Math.sin(latitude))) - mapOffsetY)

//     return { x: x, y: y }
// }


//New Map
) {
    // in Radians
    var x = (longitude - mapLonLeft) * (window.innerWidth / mapLonDelta) + 5
    
    latitude = (latitude * Math.PI) / 180
    var worldMapWidth = ((window.innerWidth / mapLonDelta) * 360) / (2 * Math.PI)
    var mapOffsetY =
        (worldMapWidth / 2) * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree))) + 720
    var y =
        window.innerHeight - ((worldMapWidth / 2) * Math.log((1 + Math.sin(latitude)) / (1 - Math.sin(latitude))) - mapOffsetY)

    return { x: x, y: y }
}