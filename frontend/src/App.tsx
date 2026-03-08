import { useState, useEffect, useCallback, useRef } from 'react'
import { usePorcupine } from '@picovoice/porcupine-react'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import './App.css'
import ShoppingListApi from './api/ShoppingListApi';
import AiApi from './api/AiApi';
import TranscriptionService from './api/TranscriptionService';

interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
}

function App() {
  const [keywordDetected, setKeywordDetected] = useState(false)
  const [detectionCount, setDetectionCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  
  // États Whisper
  const [transcription, setTranscription] = useState('')
  const [sttStatus, setSttStatus] = useState('idle') // idle, loading, transcribing, complete
  const [loadProgress, setLoadProgress] = useState(0)
  const [latency, setLatency] = useState<number | null>(null)
  const startTime = useRef<number | null>(null)
  const shoppingListApi = new ShoppingListApi();
  const aiApi = new AiApi();

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

  // Initialisation du pipeline au montage
  useEffect(() => {
    const initTranscription = async () => {
      setSttStatus('loading')
      try {
        await TranscriptionService.getInstance((progress) => {
          if (progress.status === 'progress') {
            setLoadProgress(progress.progress || 0)
          }
        })
        setSttStatus('idle')
      } catch (err: any) {
        console.error('Transcription init error:', err)
        setSttStatus('error')
      }
    }

    initTranscription()
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
    if (audioData) {
      const runTranscription = async () => {
        setLatency(null)
        startTime.current = Date.now()
        setSttStatus('transcribing')

        try {
          const text = await TranscriptionService.transcribe(audioData, (progress) => {
            if (progress.status === 'progress') {
              setLoadProgress(progress.progress || 0)
            }
          })

          setTranscription(text)
          setSttStatus('complete')
          
          if (startTime.current) {
            setLatency(Date.now() - startTime.current)
          }

          aiApi.prompt(text).then((response) => {
            console.log(response)
          })
        } catch (err: any) {
          console.error('Transcription error:', err)
          setSttStatus('error')
        }
      }

      runTranscription()
    }
  }, [audioData])

  // Arrêt automatique de l'audio après 6 secondes
  useEffect(() => {
    if (isRecording) {
      const timer = setTimeout(() => {
        stopRecording()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isRecording, stopRecording])

  const stopAudioSession = useCallback(() => {
    stopRecording()
  }, [stopRecording])

  const fetchShoppingList = useCallback(async () => {
    try {
      const shoppingList = await shoppingListApi.getShoppingList();
      setShoppingList(shoppingList)
    } catch (error) {
      console.error('Failed to fetch shopping list:', error)
    }
  }, [])

  useEffect(() => {
    fetchShoppingList()
  }, [fetchShoppingList])

  // Connexion SSE pour les mises à jour en temps réel
  useEffect(() => {
    const eventSource = new EventSource('/api/sse');

    eventSource.addEventListener('shoppingList', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ShoppingList.add') {
          console.log('Nouvel élément ajouté, rafraîchissement de la liste...');
          fetchShoppingList();
        }
      } catch (e) {
        console.error('Erreur lors du parsing de l\'événement SSE:', e);
      }
    });

    eventSource.onerror = (error) => {
      console.error('Erreur SSE:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [fetchShoppingList]);

  return (
    <div className="dashboard-container">
      <header className={`ai-mini-header ${isListening ? 'listening' : ''} ${isRecording ? 'recording' : ''} ${keywordDetected ? 'detected' : ''}`}>
        <div className="ai-status-compact">
          <div className="status-dot-mini"></div>
          <span className="status-text-mini">
            {keywordDetected ? 'Jacob: Détecté !' : 
             isRecording ? 'Jacob: Enregistrement...' :
             sttStatus === 'transcribing' ? 'Jacob: Analyse...' :
             isListening ? 'Jacob: Prêt' : 'Jacob: Inactif'}
          </span>
        </div>
        
        {sttStatus === 'loading' && (
          <div className="mini-progress">
            <div className="mini-progress-bar" style={{ width: `${loadProgress}%` }}></div>
          </div>
        )}

        <div className="mini-transcription">
          {transcription && <p>"{transcription}"</p>}
        </div>

        <div className="header-controls">
          {!isLoaded ? (
            <button className="mini-btn" onClick={initPorcupine} disabled={isInitializing}>
              {isInitializing ? '...' : 'Recréer'}
            </button>
          ) : (
            <button 
              className={`mini-btn ${isRecording || isListening ? 'stop' : ''}`} 
              onClick={() => (isRecording ? stopAudioSession() : isListening ? stop() : start())}
            >
              {isRecording ? 'Stop' : isListening ? 'Pause' : 'Play'}
            </button>
          )}
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Weather Block */}
        <section className="dashboard-card weather-card">
          <div className="card-header">
            <span className="icon">☀️</span>
            <h2>Météo</h2>
          </div>
          <div className="weather-content">
            <div className="temp">22°C</div>
            <div className="condition">Ensoleillé</div>
            <div className="location">Paris, FR</div>
          </div>
        </section>

        {/* Shopping List Block */}
        <section className="dashboard-card shopping-card">
          <div className="card-header">
            <span className="icon">🛒</span>
            <h2>Courses</h2>
          </div>
          <ul className="shopping-list">
            {shoppingList.length > 0 ? (
              shoppingList.map((item) => (
                <li key={item.id}>
                  <span>🛒</span> {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                </li>
              ))
            ) : (
              <li className="empty-list">Aucun article</li>
            )}
          </ul>
          <button className="add-item-btn" onClick={() => {/* TODO: Add item interaction */}}>+ Ajouter</button>
        </section>

        {/* Context Card (Stats/Latency) */}
        <section className="dashboard-card info-card">
          <div className="card-header">
            <span className="icon">📊</span>
            <h2>Système</h2>
          </div>
          <div className="system-info">
            {latency !== null && (
              <p>Latence: {(latency / 1000).toFixed(2)}s</p>
            )}
            <p>Interactions: {detectionCount}</p>
            {error && <p className="error-text">Erreur: {error.message}</p>}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
