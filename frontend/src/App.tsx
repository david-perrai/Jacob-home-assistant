import { useState, useEffect, useCallback, useRef } from 'react'
import { usePorcupine } from '@picovoice/porcupine-react'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import './App.css'

function App() {
  const [keywordDetected, setKeywordDetected] = useState(false)
  const [detectionCount, setDetectionCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)
  
  // États Whisper
  const [transcription, setTranscription] = useState('')
  const [sttStatus, setSttStatus] = useState('idle') // idle, loading, transcribing, complete
  const [loadProgress, setLoadProgress] = useState(0)
  const [latency, setLatency] = useState<number | null>(null)
  const startTime = useRef<number | null>(null)
  const worker = useRef<Worker | null>(null)

  const {
    keywordDetection,
    isLoaded,
    isListening,
    error,
    init,
    start,
    stop,
  } = usePorcupine()

  const accessKey = 'd2xNgk8+mW8/dkcfkOaLHogb20Nq4asDXJa6DP45iS+Uys614w1WOw==';

  const { isRecording, audioData, startRecording, stopRecording } = useAudioRecorder()

  // Initialisation du worker au montage
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module'
      })
    }

    const onMessageReceived = (e: MessageEvent) => {
      switch (e.data.status) {
        case 'progress':
          setLoadProgress(e.data.progress.progress || 0)
          break
        case 'loading':
          setSttStatus('loading')
          break
        case 'transcribing':
          setSttStatus('transcribing')
          break
        case 'complete':
          setTranscription(e.data.output)
          setSttStatus('complete')
          if (startTime.current) {
            setLatency(Date.now() - startTime.current)
          }
          break
        case 'error':
          console.error('Whisper worker error:', e.data.error)
          setSttStatus('error')
          break
      }
    }

    worker.current.addEventListener('message', onMessageReceived)
    return () => {
      worker.current?.removeEventListener('message', onMessageReceived)
    }
  }, [])

  const initPorcupine = useCallback(async () => {
    if (!accessKey || isInitializing || isLoaded) {
      return
    }
    
    setIsInitializing(true)
    try {
      await init(
        accessKey,
        {
          label: 'Ok Jacob',
          publicPath: 'models/ok-jacob.ppn',
        },
        {
          publicPath: 'models/porcupine_params_fr.pv',
        }
      )
    } catch (err) {
      console.error("Failed to initialize Porcupine:", err)
    } finally {
      setIsInitializing(false)
    }
  }, [accessKey, init, isInitializing, isLoaded])

  // Initialisation automatique au montage
  useEffect(() => {
    initPorcupine()
  }, [initPorcupine])

  // Démarrage automatique dès que c'est chargé
  useEffect(() => {
    if (isLoaded && !isListening && !error && !isRecording) {
      start().catch(err => {
        console.warn("Auto-start failed, probably user interaction required:", err)
      })
    }
  }, [isLoaded, isListening, error, start, isRecording])

  const lastDetection = useRef<any>(null)

  // Gestion de la détection du mot-clé
  useEffect(() => {
    // On ne traite la détection que si elle est nouvelle
    if (keywordDetection !== null && keywordDetection !== lastDetection.current) {
      lastDetection.current = keywordDetection
      startTime.current = Date.now()
      setLatency(null)
      
      setKeywordDetected(true)
      setDetectionCount(prev => prev + 1)
      setTranscription('') // Clear previous text
      
      // On arrête Picovoice pour laisser le micro à Whisper
      stop().then(() => {
        startRecording()
      })
      
      const timer = setTimeout(() => {
        setKeywordDetected(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [keywordDetection, stop, startRecording])

  // Quand l'enregistrement se termine, on lance la transcription
  useEffect(() => {
    if (audioData && worker.current) {
      worker.current.postMessage({
        audio: audioData
      })
    }
  }, [audioData])

  // Arrêt automatique de l'audio après 6 secondes
  useEffect(() => {
    if (isRecording) {
      const timer = setTimeout(() => {
        stopRecording()
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [isRecording, stopRecording])

  const stopAudioSession = useCallback(() => {
    stopRecording()
  }, [stopRecording])

  return (
    <main>
      <div className={`card ${isListening ? 'listening' : ''} ${isRecording ? 'recording' : ''} ${keywordDetected ? 'detected' : ''}`}>
        <h1>Jacob</h1>
        <p className="subtitle">Assistant IA Intelligent</p>
        
        <div className="status-container">
          <div className={`visualizer-ring ${isListening ? 'listening' : ''} ${isRecording ? 'recording' : ''} ${keywordDetected ? 'detected' : ''}`}>
            <div className="status-dot"></div>
          </div>
          <span className="status-text">
            {keywordDetected ? 'Détecté !' : 
             isRecording ? 'Enregistrement vocal...' :
             sttStatus === 'transcribing' ? 'Analyse en cours...' :
             isListening ? 'À l\'écoute' : 
             isInitializing ? 'Initialisation...' : 'En pause'}
          </span>
        </div>

        {sttStatus === 'loading' && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${loadProgress}%` }}></div>
            <p className="progress-label">Chargement de l'intelligence local ({Math.round(loadProgress)}%)</p>
          </div>
        )}

        <div className="transcription-area">
          {sttStatus === 'transcribing' && <div className="dot-flashing"></div>}
          {transcription && <p className="transcription-text">"{transcription}"</p>}
        </div>

        {error && (
          <div className="error-msg">
            Désolé, une erreur est survenue : {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {!isLoaded ? (
            <button 
              onClick={initPorcupine} 
              disabled={isInitializing}
            >
              {isInitializing ? 'Chargement...' : 'Réessayer l\'initialisation'}
            </button>
          ) : (
            <>
              {isRecording ? (
                <button className="stop-btn" onClick={stopAudioSession}>Terminer de parler</button>
              ) : !isListening ? (
                <button onClick={() => start()}>Reprendre l'écoute</button>
              ) : (
                <button 
                  className="stop-btn" 
                  onClick={() => stop()}
                >
                  Arrêter l'assistant
                </button>
              )}
            </>
          )}
        </div>

        {latency !== null && (
          <div className="latency-info">
            Temps de réponse : {(latency / 1000).toFixed(2)}s
          </div>
        )}

        {detectionCount > 0 && (
          <div className="stats">
            {detectionCount} {detectionCount === 1 ? 'interaction' : 'interactions'} cette session
          </div>
        )}
      </div>
    </main>
  )
}

export default App
