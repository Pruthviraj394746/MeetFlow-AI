import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

console.log("🔌 Initializing Socket Singleton to Address:", SERVER_URL);

/**
 * Singleton Socket Client
 * Configured with aggressive mobile reconnection strategies
 */
const socket = io(SERVER_URL, {
    transports: ['websocket'], // Bypass HTTP polling overhead
    autoConnect: true,
    reconnection: true,
    reconnectionDelayMax: 10000, // Wait max 10 seconds between attempts
    randomizationFactor: 0.5     // Offset jitter for mobile roaming
});

socket.on('connect', () => {
    console.log("🚀 Socket singleton connected successfully!");
});

socket.on('connect_error', (err) => {
    console.error("❌ Socket singleton connection error:", err.message);
});

socket.on('reconnect_attempt', (attemptNum) => {
    console.log(`🔌 Socket attempting to reconnect (try ${attemptNum})...`);
});

// Visibility API: Listen for tab wake-ups on mobile devices
if (typeof document !== 'undefined') {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            console.log("Wake up detected, forcing reconnection if needed...");
            if (!socket.connected) {
                socket.connect();
            }
        }
    });
}

export default socket;
