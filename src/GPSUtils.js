export function convertGeoToPixel(
    latitude,
    longitude,
    // mapWidth = 1833, // in pixels 1583
    // mapHeight = 909, // in pixels 909
    // mapLonLeft = -78.864095, // in degrees
    // mapLonDelta = -78.859849 + 78.864095, // in degrees (mapLonRight - mapLonLeft);
    // mapLatBottom = 38.43247, // in degrees
    // mapLatBottomDegree = (38.43247 * Math.PI) / 180,



    // New Map UpperLeft Corner - 38.448000, -78.877802
    // New Map UpperRight Corner - 38.448000, -78.854472
    // New Map BottomLeft Corner - 38.429002, -78.877802
    
    mapWidth = 17800, // in pixels 17800
    mapHeight = 17871, // in pixels 17871
    mapLonLeft = -78.877802, // in degrees
    mapLonDelta = -78.854472 - mapLonLeft, // in degrees (mapLonRight - mapLonLeft)
    mapLatBottom = 38.429002, // in degrees
    mapLatBottomDegree = (mapLatBottom * Math.PI) / 180

) {
    // in Radians
    var x = (longitude - mapLonLeft) * (mapWidth / mapLonDelta)

    latitude = (latitude * Math.PI) / 180
    var worldMapWidth = ((mapWidth / mapLonDelta) * 360) / (2 * Math.PI)
    var mapOffsetY =
        (worldMapWidth / 2) * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree)))
    var y =
        mapHeight - ((worldMapWidth / 2) * Math.log((1 + Math.sin(latitude)) / (1 - Math.sin(latitude))) - mapOffsetY)

    return { x: x, y: y }
}
