import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { ChakraProvider } from '@chakra-ui/react'
import { extendTheme } from '@chakra-ui/react'
import LeafletTest from './LeafletTest'
// 2. Add your color mode config
const config = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
}
// 3. extend the theme
const theme = extendTheme({ config })
ReactDOM.render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            {/* <LeafletTest /> */}
            <App />
        </ChakraProvider>
    </React.StrictMode>,
    document.getElementById('root'),
)
