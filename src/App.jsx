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
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerContent,
    DrawerCloseButton,
    DrawerOverlay,
    useDisclosure,
    Stack,
    SimpleGrid,
} from '@chakra-ui/react'
import { MapInteractionCSS } from 'react-map-interaction';
import React, { useEffect, useState, useRef } from 'react'
import { RiFileInfoFill, RiTaxiFill } from 'react-icons/ri'
import io from 'socket.io-client'
import { convertGeoToPixel, convertGeoToPixelBig } from './GPSUtils'
// import map from './images/map.png'
import map from './images/newmap.jpg'
// import sat from './images/sat.png'
import sat from './images/newsat.jpg'
import { PathLine } from 'react-svg-pathline'
import './App.css'

const socket = io('http://localhost:8022/ui')

const App = () => {
    const [destinations, setDestinations] = useState({
        home: {
            latitude: 38.433168,
            longitude: -78.86098,
            name: "Home",
            speech: "Home",
        },
    })
    const [pose, setPose] = useState({ passenger: false, safe: false })
    const lastGPS = useRef({
        latitude: 38.433905,
        longitude: -78.862169,
    })
    const [speed,setSpeed] = useState(9)
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
    const [listening, setListening] = useState()
    const [mph, setMph] = useState(0)

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

        socket.on('listening', (data) => {
           setListening(data)
        })

        socket.on('change-destination', (data) => {
            console.log("Destination changed: " + data)
            setCurrentDest(data)
        })

        socket.on('change-pullover', (data) => {
            console.log("Pullover changed: " + data)
            setPull(data)
        })

        socket.on('mph', (data) => {
            setMph(data)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function gpsToPixels({ latitude, longitude }) {
        // const widthOffeset = (window.innerWidth - 1583) / 2 - 120
        // const heightOffset = (window.innerHeight - 909) / 2 + 70
        console.log("width: " + window.innerWidth)
        console.log('height: ' + window.innerHeight)
        let { x, y } = convertGeoToPixelBig(latitude, longitude)
        //return { x: x + widthOffeset, y: y + heightOffset }
        return { x: x, y: y}
    }


    const DestinationMenuItem = ({ id }) => {
        return (
            <Box>
                <Center
                    position="absolute"
                    bg={currentDest === id ? 'limegreen' : 'red'}
                    rounded={8}
                    fontSize="4xl"
                    px={5}
                    py={1}
                    onClick={() => {
                        if (currentDest === null || pull) {
                            if (pull) {
                                setCurrentDest(null)
                                setPull(false)
                            }
                            setModal({ type: 'destination-pick', destination: id })
                        }
                    }}
                    cursor="pointer"
                >
                    {id}
                </Center>
            </Box>
        )
    }

    function DestinationMenu() {
        const { isOpen, onOpen, onClose } = useDisclosure()
        const btnRef = React.useRef()

        return (
            <>
                <Button 
                    px={20} 
                    py={10} 
                    ref={btnRef} 
                    colorScheme='teal' 
                    onClick={onOpen} 
                    fontSize="2xl" 
                    position="absolute"
                    right={40}
                    top={5}
                >
                    Destinations
                </Button>
                <Drawer
                    isOpen={isOpen}
                    placement='right'
                    onClose={onClose}
                    finalFocusRef={btnRef}
                    size='md'
                >
                    <DrawerOverlay></DrawerOverlay>
                    <DrawerContent>
                        <DrawerCloseButton></DrawerCloseButton>
                        <DrawerHeader>Available Destinations</DrawerHeader>
                        <DrawerBody>
                            <Flex>
                                <SimpleGrid columns={2} spacingX={60} spacingY={20}>
                                    {Object.keys(destinations).map((id) => {
                                        return <DestinationMenuItem key={id} id={id} />
                                    })}
                                </SimpleGrid>
                            </Flex>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </>
        )
    }

    const Destination = ({ id }) => {
        const { x, y } = gpsToPixels(destinations[id])
        return (
            <Center
                position="absolute"
                bg={currentDest === id ? 'limegreen' : 'red'}
                left={x - 15}
                // left={x}
                top={y}
                // boxSize={2}
                rounded={8}
                fontSize={10}
                px={2}
                py={1}
                onClick={() => {
                    if (currentDest === null || pull) {
                        if (pull) {
                            setCurrentDest(null)
                            setPull(false)
                        }
                        setModal({ type: 'destination-pick', destination: id })
                    }
                }}
                onTouchStart={() => {
                    if (currentDest === null || pull) {
                        if (pull) {
                            setCurrentDest(null)
                            setPull(false)
                        }
                        setModal({ type: 'destination-pick', destination: id })
                    }
                }}
                cursor="pointer"
            >
                {destinations[id].name}
            </Center>
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

        const { x, y } = gpsToPixels(gps)
        return (
            <Circle bg="orange" left={x} top={y} position="absolute" p="8px" boxShadow="dark-lg">
                <Icon as={RiTaxiFill} boxSize={4} color="black" />
            </Circle>
        )
    }

    const RenderPath = () => {
        const [path, setPath] = useState([...pathRef.current])
        socket.on('path', (x) => {
            pathRef.current = x.map((x) => {
                return gpsToPixels(x)
            })

            setPath([...pathRef.current])
        })
        console.log(path)
        return (
            path.length > 0 && (
                <PathLine points={path} stroke="#10c400" strokeWidth="5" fill="none" r={5} />
            )
        )
    }

    const ModalConfirm = () => {
        function getBody() {
            if (modal.type === 'destination-pick') {
                return 'Do you want to drive to ' + destinations[modal.destination].name + '?'
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
        
        <Flex w="100vw" h="100vh" justify="center" bg={view ? '#F6F7F9' : '#4E5C44'} overflow="hidden">
            
            <MapInteractionCSS
                maxScale={4}
                minScale={1}
                //translationBounds={{xMin: -570, xMax: 0, yMin: -1220, yMax: 0}}
                btnClass='btnStyle'
                
                showControls
                >
                
                <Cart />
                {Object.keys(destinations).map((id) => {
                    return <Destination key={id} id={id} />
                })}
                
                <Image src={view ? map : sat} w={window.innerWidth} objectFit="contain" />
                <css position='relative'><svg style={{ position: 'absolute' }} viewBox="0 0 4000 4000" >
                    {state.state === 'transit-start' && <RenderPath/>}
                </svg></css>
                
                
            </MapInteractionCSS>
            {/* <svg style={{ position: 'relative' }} viewBox="0 0 1920 1080" >
                    {state.state === 'transit-start' && <RenderPath/>}
                </svg> */}
            <DestinationMenu />
            <ModalConfirm />
            <Flex bottom={10} right={10} position="absolute">
            <Box bg="gray.100" color="black" border="1px" p={3} bottom={10} right={40} rounded="xl" px={7} position="absolute">
                    {"MPH: " + mph}
                </Box>
                <Button colorScheme="blue" position="absolute" right={10} bottom={10} onClick={() => setView(!view)}>
                {!view ? 'Terrain' : 'Satellite'}
                </Button>
            </Flex>
            
            {listening && (
                <Flex bottom={10} position="absolute" fontSize="5xl">
                    <Box
                            bg="green.500"
                            color="white"
                            p={10}
                            px={40}
                            ml={4}
                            rounded="lg"
                            shadow="dark-lg"
                        >
                            Listening
                        </Box>
                </Flex>
            )}
            {currentDest && !pull && (
                <>
                    <Flex left={10} bottom={10} position="absolute" fontSize="3xl">
                        <Box
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
                            Driving to {destinations[currentDest].name}
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
                    <Flex left={10} bottom={10} position="absolute" fontSize="3xl">
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

            {!state.active && <FullScreenMessage title="Cart is offline..." />}
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
            <Flex position='absolute' top='0' left='0' m={12}>
                <Button bg={speed===4?'red.400':'gray.600'} _hover={{bg:'grey.800'}} size='lg' mr={4} onClick={()=>{
                    socket.emit('speed', 4.0)
                    setSpeed(4)
                }}>Slower</Button>
                <Button bg={speed===9?'red.400':'gray.600'} _hover={{bg:'grey.800'}} size='lg' mr={4} onClick={()=>{
                    socket.emit('speed', 9.0)
                    setSpeed(9)

                }}>Normal</Button>
                <Button bg={speed===11?'red.400':'gray.600'} _hover={{bg:'grey.800'}} size='lg' mr={4} onClick={()=>{
                    socket.emit('speed', 11.0)
                    setSpeed(11)

                }}>Faster</Button>
                <Button bg={speed===14?'red.400':'gray.600'} _hover={{bg:'grey.800'}} size='lg' onClick={()=>{
                    socket.emit('speed', 14.0)
                    setSpeed(14)
                }}>Turbo</Button>

            </Flex>
        </Flex>
       
        
    )
}
export default App
