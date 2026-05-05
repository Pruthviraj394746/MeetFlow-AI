const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sanitizeAiReply = (reply) => {
    if (!reply || typeof reply !== 'string') {
        return 'I could not generate a response right now.';
    }

    return reply.trim().slice(0, 2000);
};

const transcribeMeetingAudio = async ({ audioBuffer, mimeType, fileName }) => {
    if (!audioBuffer || !audioBuffer.length) {
        return '';
    }

    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is missing in backend environment.');
    }

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
    formData.append('file', blob, fileName || 'meeting-audio.webm');
    formData.append('model', process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: formData
    });

    if (!response.ok) {
        const details = await response.text().catch(() => 'Unknown transcription error');
        throw new Error(`Audio transcription failed: ${details}`);
    }

    const payload = await response.json();
    return (payload.text || '').trim();
};

const getAiResponse = async ({ prompt, userName, roomId, audioTranscript = '' }) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return 'AI is not configured yet. Ask the host to set GROQ_API_KEY in backend/.env.';
        }

        const transcriptSection = audioTranscript
            ? `\nMeeting audio transcript (latest capture):\n${audioTranscript}\n`
            : '\nMeeting audio transcript (latest capture): unavailable.\n';

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are MeetFlow AI, a concise and helpful meeting assistant in a live room chat. Use the meeting audio transcript as primary context when available. Keep replies practical and brief.'
                },
                {
                    role: 'user',
                    content: `Room: ${roomId || 'unknown'}\nUser: ${userName || 'Guest'}\nPrompt: ${prompt}${transcriptSection}`
                }
            ],
            model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
            temperature: 0.4,
            max_tokens: 300,
            stream: true
        });

        let aiReply = '';
        for await (const part of chatCompletion) {
            aiReply += part.choices?.[0]?.delta?.content || '';
        }
        return sanitizeAiReply(aiReply);
    } catch (error) {
        console.error('Error in getAiResponse:', error);
        return "Sorry, I couldn't generate a response right now.";
    }
};

module.exports = { getAiResponse, transcribeMeetingAudio };
