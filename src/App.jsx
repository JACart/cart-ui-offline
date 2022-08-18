import {
    Box,
    Button,
    Center,
    Circle,
    Divider,
    Flex,
    Icon,
    Image,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from '@chakra-ui/react'
import React, { useEffect, useState, useRef } from 'react'
import { RiFileInfoFill, RiTaxiFill } from 'react-icons/ri'
import io from 'socket.io-client'
import { convertGeoToPixel } from './GPSUtils'
// import map from './images/map.png'
// import sat from './images/sat.png'
import { PathLine } from 'react-svg-pathline'

import { LatLngBounds } from 'leaflet'
import { ImageOverlay, MapContainer,Polyline, Pane } from 'react-leaflet'
import Marker from 'react-leaflet-enhanced-marker'

const socket = io('http://localhost:8022/ui')

const position = [38.4330762517706, -78.86152024308338]
const bounds = new LatLngBounds([38.434993460023776, -78.86510684108488], [38.431858478265596, -78.85740130324349])

const App = () => {
    const [destinations, setDestinations] = useState({
        home: {
            latitude: 38.433168,
            longitude: -78.86098,
        },
    })
    const [pose, setPose] = useState({ passenger: false, safe: false })
    const lastGPS = useRef({
        latitude: 38.433905,
        longitude: -78.862169,
    })
    const [pull, setPull] = useState(false)
    const [view, setView] = useState(true)
    const [modal, setModal] = useState({ type: null })
    const [currentDest, setCurrentDest] = useState(null)
    const pathRef = useRef([])
    const [state, setState] = useState({
        destination: '',
        active: false,
        state: 'summon-start',
        _id: 'jakart',
        userId: '',
        latitude: 38.447471618652344,
        longitude: -78.87019348144531,
        pullover: false,
    })

    const ref = useRef()

    useEffect(() => {
        socket.on('get-destinations', (data) => {
            setDestinations(data)
        })
        socket.on('pose', (x) => {
            setPose(x)
        })

        socket.on('ui-init', (data) => {
            setState(data)
            if (data.state === 'transit-end' || data.state === 'summon-finish') {
                setCurrentDest(null)
            }
        })
        socket.on('disconnect', () => {
            setState({ ...state, active: false })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function gpsToPixels({ latitude, longitude }) {
        const widthOffeset = (window.innerWidth - 1583) / 2 - 120
        const heightOffset = (window.innerHeight - 909) / 2 + 70
        let { x, y } = convertGeoToPixel(latitude, longitude)
        return { x: x + widthOffeset, y: y + heightOffset }
    }

    const Destination = ({ id }) => {
        return (
            <Marker
                position={[destinations[id].latitude, destinations[id].longitude]}
                zIndex={-1}
                eventHandlers={{
                    click: () => {
                        if (currentDest === null || pull) {
                            if (pull) {
                                setCurrentDest(null)
                                setPull(false)
                            }
                            setModal({ type: 'destination-pick', destination: id })
                        }
                    },
                }}
                icon={
                    <Center bg={currentDest === id ? 'limegreen' : 'red'} rounded={8} fontSize="32px" px={32} py={8} zIndex={-1}>
                        {id}
                    </Center>
                }
            ></Marker>
        )
    }


    const Cart = () => {
        const [gps, setGPS] = useState(lastGPS.current)

        useEffect(() => {
            socket.on('gps', (x) => {
                setGPS(x)
                lastGPS.current = x
            })
        }, [])

        return (
            <Marker
                zIndex={9999}
                icon={
                    <Circle bg="orange" position="absolute" p="10px" boxShadow="0 0 19px black" zIndex={9999} css={{zIndex:9999}}>
                        <Icon as={RiTaxiFill} boxSize={32} color="black" />
                    </Circle>
                
                }
                position={[gps.latitude, gps.longitude]}
            ></Marker>
        )
    }
    const RenderPath = () => {
        const [path, setPath] = useState([...pathRef.current])
        socket.on('path', (x) => {
            pathRef.current = x.map((x) => {
                return [x.latitude,x.longitude]
            })

            setPath([...pathRef.current])
        })
        return (
            path.length > 0 && (
                <Polyline weight={32} positions={path} color="orange" lineCap='round' opacity={.7} smoothFactor={8} />
            )
        )
    }

    const ModalConfirm = () => {
        function getBody() {
            if (modal.type === 'destination-pick') {
                return 'Do you want to drive to ' + modal.destination + '?'
            } else if (modal.type === 'pullover') {
                return 'Do you want to pullover?'
            }
        }

        return (
            <>
                <Modal
                    isOpen={modal.type}
                    onClose={() => setModal({ type: null })}
                    size="xl"
                    isCentered
                    motionPreset="slideInBottom"
                >
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>
                            <Flex>
                                <Circle bg="orange" p="8px" boxShadow="dark-lg">
                                    <Icon as={RiTaxiFill} boxSize={6} color="black" />
                                </Circle>
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <Divider />
                        <ModalBody fontSize="2xl" fontWeight="bold" mt={3}>
                            {getBody()}
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                colorScheme="blue"
                                mr={3}
                                size="lg"
                                px={12}
                                py={7}
                                fontSize="2xl"
                                onClick={() => {
                                    setModal({ type: null })
                                    if (modal.type === 'destination-pick') {
                                        setCurrentDest(modal.destination)
                                        socket.emit('destination', modal.destination)
                                    } else if (modal.type === 'pullover') {
                                        setPull(true)
                                        socket.emit('pullover', true)
                                    }
                                }}
                            >
                                Yes
                            </Button>
                            <Button
                                size="lg"
                                px={12}
                                py={7}
                                fontSize="2xl"
                                colorScheme="red"
                                onClick={() => setModal({ type: null })}
                            >
                                Cancel
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>
        )
    }

    const FullScreenMessage = ({ title }) => {
        return (
            <Flex
                position="absolute"
                w="100vw"
                h="100vh"
                bg="#ffffff2b"
                align="center"
                justify="center"
                fontSize="4xl"
                css={{ backdropFilter: 'blur(10px)' }}
            >
                <Box bg="gray.700" p={2} shadow="dark-lg" rounded="xl" px={6}>
                    {title}
                </Box>
            </Flex>
        )
    }



    return (
        <>
            <MapContainer
                style={{ height: '100vh', width: '100vw' }}
                center={position}
                ref={ref}
                zoom={19}
                dragging={false}
                maxZoom={19}
                minZoom={19}
            >
                <ImageOverlay url="/satnew.png" bounds={bounds} zIndex={0} />
              
                
                {Object.keys(destinations).map((id) => {
                    return <Destination key={id} id={id} />
                })}
                {state.state === 'transit-start' && <RenderPath />}
            
                <Cart />

            </MapContainer>
            <Flex
                pointerEvents="none"
                w="100vw"
                h="100vh"
                top="0"
                left="0"
                justify="center"
                position="absolute"
                overflow="hidden"
                zIndex={1005}
            >
                {/* <Image src={view ? map : sat} w={window.innerWidth} objectFit="contain" /> */}

             

                <ModalConfirm />
                {/* <Button colorScheme="blue" position="absolute" right={10} bottom={10} onClick={() => setView(!view)}>
                    {!view ? 'Terrain' : 'Satellite'}
                </Button> */}
                {currentDest && !pull && (
                    <>
                        <Flex left={10} bottom={10} position="absolute" fontSize="3xl" >
                            <Box
                                pointerEvents='auto'
                                bg="red.500"
                                color="white"
                                p={2}
                                px={4}
                                ml={4}
                                rounded="lg"
                                shadow="dark-lg"
                                cursor="pointer"
                                onClick={() => setModal({ type: 'pullover' })}
                            >
                                Pullover
                            </Box>
                        </Flex>
                        <Flex top={18} position="absolute" fontSize="3xl" boxShadow="lg">
                            <Box bg="gray.100" color="black" p={2} px={4} rounded="lg" border="1px">
                                Driving to {currentDest}
                            </Box>
                        </Flex>
                    </>
                )}

                {!currentDest && (
                    <Flex top={18} position="absolute" fontSize="3xl" boxShadow="lg">
                        <Box bg="gray.100" color="black" p={2} px={4} rounded="lg" border="1px">
                            Choose a destination
                        </Box>
                    </Flex>
                )}

                {pull && (
                    <>
                        <Flex left={10} bottom={10} position="absolute" fontSize="3xl" pointerEvents="auto">
                            <Box
                                bg="green.500"
                                color="white"
                                p={2}
                                px={4}
                                ml={4}
                                rounded="lg"
                                shadow="dark-lg"
                                cursor="pointer"
                                onClick={() => {
                                    setPull(false)
                                    socket.emit('pullover', false)
                                }}
                            >
                                Resume
                            </Box>
                            {/* <Box
                            bg="red.500"
                            color="white"
                            p={2}
                            px={4}
                            ml={4}
                            rounded="lg"
                            shadow="dark-lg"
                            cursor="pointer"
                            onClick={() => {
                                setCurrentDest(null)
                                setPull(false)
                            }}
                        >
                            Change Destination
                        </Box> */}
                        </Flex>
                        <Flex top={18} position="absolute" fontSize="3xl" boxShadow="lg">
                            <Box bg="gray.100" color="black" p={2} px={4} rounded="lg" border="1px">
                                Change Destination
                            </Box>
                        </Flex>
                    </>
                )}

                {   !state.active && <FullScreenMessage title="Cart is offline..." />}
                {state.state === 'transit-end' && (
                    <FullScreenMessage
                        title="You have arrived at your destination. Exit the cart safely or select a new destination."
                        onPress={() => {}}
                    />
                )}
                {pose.passenger && !pose.safe && (
                    <FullScreenMessage
                        title="Please adjust yourself and be seated properly. Unsafe pose detected."
                        onPress={() => {}}
                    />
                )}
            </Flex>
        </>
    )
}
export default App
