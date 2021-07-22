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
import React, { useEffect, useState } from 'react'
import { RiTaxiFill } from 'react-icons/ri'
import io from 'socket.io-client'
import { convertGeoToPixel } from './GPSUtils'
import map from './images/map.png'
import sat from './images/sat.png'
const socket = io('http://localhost:8021/ui')

const App = () => {
    const [gps, setGPS] = useState({
        latitude: 38.433905,
        longitude: -78.862169,
    })

    const [destinations, setDestinations] = useState({})
    const [pose, setPose] = useState({ passenger: false, safe: false })
    const [path, setPath] = useState([])
    const [pull, setPull] = useState(false)
    const [view, setView] = useState(true)
    const initialGPS = React.useRef(false)
    const [modal, setModal] = useState({ type: null })
    const [currentDest, setCurrentDest] = useState(null)

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

    useEffect(() => {
        socket.on('get-destinations', (data) => {
            setDestinations(data)
        })
        socket.on('pose', (x) => {
            setPose(x)
        })
        socket.on('path', (x) => {
            setPath(
                x.map((x) => {
                    return { lat: x.latitude, lng: x.longitude }
                }),
            )
        })
        socket.on('gps', (x) => {
            // if(modal.type!=='pullover' ){
                // if(!initialGPS.current){
                  //  setGPS(x)
                    // initialGPS.current = true
                // }else{
                
                        setGPS(x)
               
                // }
            // }
        })
        socket.on('ui-init', (data) => {
            setState(data)
            if (data.state === 'transit-finish') {
                modal.type = 'transit-finish'
                setCurrentDest(null)
            }
        })
        socket.on('disconnect', () => {
            setState({ ...state, active: false })
        })
    }, [])

    function gpsToPixels({ latitude, longitude }) {
        const widthOffeset = (window.innerWidth - 1583) / 2
        const heightOffset = (window.innerHeight - 909) / 2
        let { x, y } = convertGeoToPixel(latitude, longitude)
        // console.log()

        return { x: x + widthOffeset, y: y + heightOffset }
    }

    const Destination = ({ id }) => {
        const { x, y } = gpsToPixels(destinations[id])
        return (
            <Center
                position="absolute"
                bg="red"
                left={x - 15}
                top={y}
                rounded={8}
                fontSize='4xl'
                px={5}
                py={1}
                onClick={() => {
                    setModal({ type: 'destination-pick', destination: id })
                }}
                cursor="pointer"
            >
                {id}
            </Center>
        )
    }

    const Cart = () => {
        const { x, y } = gpsToPixels(gps)
   //
   //  console.log(x, y)
        return (
            <Circle bg="orange" left={x - 19} top={y - 19} position="absolute" p="8px" boxShadow="dark-lg">
                <Icon as={RiTaxiFill} boxSize={6} color="black" />
            </Circle>
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
                            <Button colorScheme="red" onClick={() => setModal({ type: null })}>
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
        <Flex w="100vw" h="100vh" justify="center" bg={view ? '#F6F7F9' : '#4E5C44'}>
            <Image src={view ? map : sat} w={window.innerWidth} objectFit="contain" />
            {Object.keys(destinations).map((id) => {
                return <Destination key={id} id={id} />
            })}
            <Cart />
            <ModalConfirm />
            <Button colorScheme="blue" position="absolute" right={10} bottom={10} onClick={() => setView(!view)}>
                {!view ? 'Terrain' : 'Satellite'}
            </Button>
            {currentDest && !pull && (
                <Flex left={10} bottom={10} position="absolute" fontSize="3xl">
                    <Box bg="gray.100" color="black" p={2} px={4} rounded="lg" border="1px">
                        Driving to {currentDest}
                    </Box>
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
            )}

            {!currentDest && (
                <Flex left={10} bottom={10} position="absolute" fontSize="3xl">
                    <Box bg="gray.100" color="black" p={2} px={4} rounded="lg" border="1px">
                        Choose a destination
                    </Box>
                </Flex>
            )}

            {pull && (
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
                    <Box
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
                    </Box>
                </Flex>
            )}

            {!state.active && <FullScreenMessage title="Cart is offline..." />}
            {state.state === 'transit-end' && (
                <FullScreenMessage
                    title="You have arrived at your destination. Please exit the cart safely."
                    onPress={() => {}}
                />
            )}
        </Flex>
    )
}
export default App
