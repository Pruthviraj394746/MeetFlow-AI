import { useState, useEffect, useCallback } from 'react';

const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState(null);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error("Speech Recognition API not supported in this browser.");
            setSupported(false);
            return;
        }

        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        let finalTranscript = '';

        recog.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const tr = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += tr + ' ';
                } else {
                    interimTranscript += tr;
                }
            }
            setTranscript(finalTranscript + interimTranscript);
        };

        recog.onerror = (event) => {
            console.error("Speech Recognition Error", event.error);
            if (event.error === 'not-allowed') {
                setIsListening(false);
            }
        };

        recog.onend = () => {
            // Auto restart if intended to be listening
            if (isListening) {
                try {
                    recog.start();
                } catch (e) {
                    console.error("Could not auto-restart", e);
                    setIsListening(false);
                }
            } else {
                setIsListening(false);
            }
        };

        setRecognition(recog);

        return () => {
             recog.stop();
        }
    }, [isListening]); // Re-attach listener dependent on intended state

    const startListening = useCallback(() => {
        if(recognition && !isListening) {
             try {
                recognition.start();
                setIsListening(true);
             } catch(e) {
                console.error("Failed to start", e);
             }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if(recognition && isListening) {
            setIsListening(false);
            recognition.stop();
        }
    }, [recognition, isListening]);
    
    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        transcript,
        isListening,
        startListening,
        stopListening,
        resetTranscript,
        supported
    };
};

export default useSpeechRecognition;
