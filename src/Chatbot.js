import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';  // Importar face-api.js para el reconocimiento facial
import './Chatbot.css';

const Chatbot = () => {
  const [question, setQuestion] = useState('');  // Para almacenar la pregunta (escrita o dictada)
  const [response, setResponse] = useState('');  // Para almacenar la respuesta del chatbot
  const [loading, setLoading] = useState(false);  // Para manejar el estado de carga
  const [cameraOpen, setCameraOpen] = useState(false);  // Para controlar la apertura del modal de la cámara
  const [smilingMessage, setSmilingMessage] = useState('');  // Para mostrar el mensaje de sonrisa
  const recognition = useRef(null);  // Referencia al reconocimiento de voz
  const silenceTimeout = useRef(null);  // Controla el tiempo de espera por silencio
  const videoRef = useRef(null);  // Referencia para el video de la cámara
  const canvasRef = useRef(null);  // Referencia al canvas para dibujar las detecciones
  const [voices, setVoices] = useState([]);
  const [detectedTia, setDetectedTia] = useState(false);  // Indica si se dijo "TIA"
  const [modelsLoaded, setModelsLoaded] = useState(false);  // Indica si los modelos están cargados
  const latestQuestion = useRef('');  // Referencia a la última pregunta capturada

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Cargar los modelos para reconocimiento facial
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);  // Indicar que los modelos están cargados
        console.log("Modelos de face-api.js cargados correctamente.");
      } catch (error) {
        console.error("Error al cargar los modelos de face-api.js:", error);
      }
    };

    loadModels();

    // Cargar las voces disponibles para la síntesis de voz
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Inicializar el reconocimiento de voz
    initializeSpeechRecognition();

    // Limpiar cuando el componente se desmonte
    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      clearTimeout(silenceTimeout.current);
    };
  }, []);

  // Inicializar el reconocimiento de voz
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta SpeechRecognition.');
      return;
    }

    recognition.current = new SpeechRecognition();
    recognition.current.lang = 'es-ES';
    recognition.current.interimResults = true;
    recognition.current.continuous = true;

    recognition.current.onstart = () => {
      console.log('Reconocimiento de voz iniciado...');
    };

    recognition.current.onresult = (event) => {
      let interimText = '';
      let hasDetectedTia = false;

      // Procesar resultados intermedios
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        interimText += transcript;

        // Mostrar la transcripción en el campo de texto mientras se dicta
        setQuestion(transcript);

        console.log(`Texto detectado: ${transcript}`); // Verificar cada resultado en la consola

        // Detectar la palabra clave "TIA" o "tía"
        if (transcript.includes('tia') || transcript.includes('tía')) {
          hasDetectedTia = true;
          setDetectedTia(true);  // Se ha detectado la palabra "TIA" o "tía"
          console.log('Palabra "TIA" o "tía" detectada');

          const pregunta = transcript.split(/tia|tía/)[1]?.trim();  // Captura lo que sigue a "TIA" o "tía"
          
          if (pregunta) {
            setQuestion(pregunta);  // Actualizar el estado con la pregunta dictada
            latestQuestion.current = pregunta;  // Guardar la pregunta en la referencia
          }

          // Limpiar cualquier timeout anterior
          clearTimeout(silenceTimeout.current);

          // Esperar 2 segundos de silencio después de decir "TIA" o "tía", luego enviar la pregunta automáticamente
          silenceTimeout.current = setTimeout(() => {
            if (!pregunta || pregunta.length === 0) {
              console.log('Solo se dijo "TIA". Enviando saludo...');
              handleTiaGreeting();  // Enviar saludo si solo se dijo "TIA"
            } else {
              console.log('Silencio detectado. Enviando la pregunta...');
              handleSubmit(latestQuestion.current);  // Asegúrate de enviar la pregunta capturada automáticamente
            }
          }, 2000);  // Tiempo de silencio de 2 segundos
        }
      }

      if (!hasDetectedTia) {
        console.log('No se detectó "TIA" o "tía". No se transcribe ni envía nada.');
      }
    };

    recognition.current.onerror = (event) => {
      console.error('Error en el reconocimiento de voz:', event.error);
    };

    recognition.current.start();  // Siempre activo, no se detiene
    console.log('Reconocimiento de voz configurado correctamente y activo.');
  };

  // Función para gestionar el saludo cuando se detecta solo "TIA" o "tía"
  const handleTiaGreeting = () => {
    const greeting = "Soy tu TIA, ¿en qué puedo ayudarte?";
    console.log(greeting);
    setResponse(greeting);  // Mostrar el saludo en la pantalla
    speakWithFemaleVoice(greeting);  // Leer el saludo en voz femenina

    // Apagar el micrófono y vaciar variables antes de reiniciar
    resetAndRestartMicAfterResponse();
  };

  // Función para apagar el micrófono, vaciar variables y reiniciar después de leer la respuesta
  const resetAndRestartMicAfterResponse = () => {
    if (recognition.current) {
      recognition.current.stop();  // Apagar el micrófono inmediatamente al enviar la pregunta
      console.log('Micrófono apagado al enviar la pregunta.');

      // El micrófono se reiniciará al terminar de leer la respuesta (ver speakWithFemaleVoice)
    }
  };

  // Función para sintetizar la voz con voz femenina en español
  const speakWithFemaleVoice = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    // Buscar una voz femenina en español (es-ES)
    const femaleVoice = voices.find(voice => voice.lang === 'es-ES' && (voice.name.includes('Female') || voice.name.includes('femenina')));
    utterance.voice = femaleVoice || voices.find(voice => voice.lang === 'es-ES');
    utterance.lang = 'es-ES';  // Asegurarse de que el idioma sea español

    if (!utterance.voice) {
      console.warn('No se encontró una voz femenina en español.');
    }

    synth.speak(utterance);

    // Reactivar el micrófono después de que termine de leer la respuesta
    utterance.onend = () => {
      console.log('Lectura de la respuesta completada. Reiniciando reconocimiento de voz...');
      setQuestion('');  // Borrar el campo de entrada de la pregunta solo después de leer la respuesta
      initializeSpeechRecognition();  // Reiniciar el reconocimiento después de leer la respuesta
    };
  };

  // Manejador para enviar la consulta al chatbot
  const handleSubmit = async (capturedQuestion) => {
    if (!capturedQuestion || capturedQuestion.trim() === "") {
      console.log("La pregunta está vacía o no válida.");
      return;  // Asegurarse de que haya una pregunta válida
    }

    // Detener el micrófono al enviar la pregunta
    resetAndRestartMicAfterResponse();

    setLoading(true);

    try {
      console.log(`Enviando la pregunta: ${capturedQuestion}`);
      const res = await axios.post('http://localhost:8000/ask', {
        question: capturedQuestion,  // Enviar la pregunta capturada
        max_tokens:300,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setResponse(res.data.response);
      speakWithFemaleVoice(res.data.response);  // Leer la respuesta en voz femenina
    } catch (error) {
      console.error('Error al obtener respuesta:', error);
      setResponse('Hubo un error al contactar al chatbot.');
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir la cámara
  const handleCameraClick = () => {
    setCameraOpen(true);
    startVideo();
  };

  // Función para iniciar el video de la cámara
  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => {
        console.error('Error al acceder a la cámara: ', err);
      });
  };

  // Función para detectar sonrisas
const handleVideoPlay = () => {
  const intervalId = setInterval(async () => {
    if (videoRef.current && canvasRef.current && modelsLoaded) {
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, {
        width: videoRef.current.width,
        height: videoRef.current.height
      });

      // Limpiar el canvas y dibujar las detecciones faciales
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      // Verificar si la persona está sonriendo
      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        console.log('Expresiones detectadas:', expressions);  // Verifica si las expresiones se están detectando correctamente
        if (expressions.happy > 0.5) {
          setSmilingMessage("¡Qué lindo o linda, estás sonriendo!");
        } else {
          setSmilingMessage("");
        }
      }
    }
  }, 500);  // Detección cada 500ms

  return () => clearInterval(intervalId);
};

  // Función para cerrar la cámara
  const closeCamera = () => {
    setCameraOpen(false);
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());  // Detener la cámara
    videoRef.current.srcObject = null;
  };

  return (
    <div className="chatbot-container" role="main">
      <div className="chat-header">
        <h2>Chatbot TIA</h2>
      </div>
      <div className="chat-form">
        {/* Campo de entrada de texto para escribir la pregunta manualmente */}
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Escribe tu pregunta o habla..."
          className="chat-input"
        />
        {/* Botón para enviar la pregunta manualmente */}
        <button
          className="chat-button"
          onClick={() => handleSubmit(question)}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Enviar'}
        </button>

        <div className="chat-response">
          <strong>Respuesta de la TIA:</strong>
          <p>{response}</p>  {/* Mostrar la respuesta del chatbot */}
        </div>

        {/* Botón para abrir la cámara */}
        <button onClick={handleCameraClick} className="camera-button">
          Abrir Cámara
        </button>

        {/* Modal de la cámara */}
        {cameraOpen && (
          <div className="camera-modal">
            <div className="modal-content">
              <video ref={videoRef} onPlay={handleVideoPlay} autoPlay muted width="320" height="240" />
              <canvas ref={canvasRef} width="320" height="240" />
              {smilingMessage && <p>{smilingMessage}</p>}
              <button onClick={closeCamera} className="close-camera">Cerrar Cámara</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
