export function convertGeoToPixel(
    latitude,
    longitude,
    mapWidth = 1583, // in pixels
    mapHeight = 909, // in pixels
    mapLonLeft = -78.864095, // in degrees
    mapLonDelta = -78.859849 + 78.864095, // in degrees (mapLonRight - mapLonLeft);
    mapLatBottom = 38.43247, // in degrees
    mapLatBottomDegree = (38.43247 * Math.PI) / 180,
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
