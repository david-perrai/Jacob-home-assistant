import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#55c7a5' },
    secondary: { main: '#f3a76b' },
    background: { default: '#111713', paper: '#1b231e' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Outfit", "Avenir Next", sans-serif',
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
