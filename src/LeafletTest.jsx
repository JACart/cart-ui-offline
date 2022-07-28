import React, { useState, useEffect } from 'react'
import { Box, Text, Center, Flex, Image, Circle, Icon } from '@chakra-ui/react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

const position = [38.433839, -78.862208]

const LeafletTest = () => {
    return (
        <MapContainer
            style={{ height: '100vh', width: '100vw' }}
            className="markercluster-map"
            center={position}
            zoom={19}
            maxZoom={20}
        >
            <TileLayer
                url="/tiles/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
        </MapContainer>
    )
}

export default LeafletTest
