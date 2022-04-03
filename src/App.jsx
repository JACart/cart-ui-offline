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
import { convertGeoToPixel } from './GPSUtils'
//import map from './images/map.png'
import map from './images/newmap.jpg'
import sat from './images/sat.png'
import { PathLine } from 'react-svg-pathline'
const socket = io('http://localhost:8022/ui')

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function gpsToPixels({ latitude, longitude }) {
        const widthOffeset = (window.innerWidth - 1583) / 2 - 120
        const heightOffset = (window.innerHeight - 909) / 2 + 70
        let { x, y } = convertGeoToPixel(latitude, longitude)
        return { x: x + widthOffeset, y: y + heightOffset }
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
                    right={10} 
                    top={10}
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
            <Circle bg="orange" left={x - 32} top={y - 32} position="absolute" p="16px" boxShadow="dark-lg">
                <Icon as={RiTaxiFill} boxSize={6} color="black" />
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
        return (
            path.length > 0 && (
                <svg style={{ position: 'absolute' }} viewBox="0 0 1920 1080">
                    <PathLine points={path} stroke="#10c400" strokeWidth="5" fill="none" r={5} />
                </svg>
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
        <Flex>
            
            <Flex w="100vw" h="100vh" justify="center" bg={view ? '#F6F7F9' : '#4E5C44'} overflow="hidden">
                <MapInteractionCSS>
                    <Image src={view ? map : sat} objectFit="contain" />
                    {Object.keys(destinations).map((id) => {
                        return <Destination key={id} id={id} />
                    })}
                </MapInteractionCSS>
                {state.state === 'transit-start' && <RenderPath />}
                
                <DestinationMenu />
                <Cart />
                <ModalConfirm />
                <Button colorScheme="blue" position="absolute" right={10} bottom={10} onClick={() => setView(!view)}>
                    {!view ? 'Terrain' : 'Satellite'}
                </Button>
                
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
                <Flex position='absolute' top='0' left='0' m={8}>
                    <Button bg={speed===8?'red.400':'gray.600'} _hover={{bg:'grey.800'}} size='lg' mr={4} onClick={()=>{
                        socket.emit('speed', 8)
                        setSpeed(8)
                    }}>Slower</Button>
                    <Button bg={speed===9?'red.400':'gray.600'} _hover={{bg:'grey.800'}} size='lg' mr={4} onClick={()=>{
                        socket.emit('speed', 9)
                        setSpeed(9)

                    }}>Normal</Button>
                    <Button bg={speed===10?'red.400':'gray.600'} _hover={{bg:'grey.800'}} size='lg' onClick={()=>{
                        socket.emit('speed', 10)
                        setSpeed(10)

                    }}>Faster</Button>
                </Flex>
            </Flex>
        </Flex>
        
    )
}
export default App
