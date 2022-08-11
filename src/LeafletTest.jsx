import React, { useRef } from 'react'
import { LatLngBounds } from 'leaflet'
import { ImageOverlay, MapContainer } from 'react-leaflet'

const position = [38.433839, -78.862208]

const LeafletTest = () => {
    const ref = useRef()
    const bounds = new LatLngBounds([38.443363, -78.87755], [38.42915035514814, -78.85702218643952])
    return (
        <MapContainer
            style={{ height: '100vh', width: '100vw' }}
            className="markercluster-map"
            center={position}
            ref={ref}
            zoom={19}
            maxZoom={19}
        >
            <ImageOverlay url="/newmap.jpg" bounds={bounds} opacity={0.5} />
        </MapContainer>
    )
}

export default LeafletTest
