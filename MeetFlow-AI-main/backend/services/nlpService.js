/**
 * Enhanced Simulated NLP Service for Action Item Extraction.
 * PROMPT FOR REAL OPENAI/CLAUDE INTEGRATION:
 * System Prompt: "You are an AI meeting assistant. Extract clear action items from the provided meeting transcript chunk. Return ONLY a JSON array of objects with keys: 'task', 'assignee', 'deadline'."
 */

// Helper to infer dates like "tomorrow", "next week"
const inferDate = (text) => {
    const lower = text.toLowerCase();
    const today = new Date();
    
    if (lower.includes('tomorrow')) {
        today.setDate(today.getDate() + 1);
        return today.toDateString();
    }
    if (lower.includes('next week')) {
        today.setDate(today.getDate() + 7);
        return today.toDateString();
    }
    if (lower.includes('eod') || lower.includes('end of day')) {
        return 'Today EOD';
    }
    
    // Match explicit dates or days of week (naive approach)
    const dayMatch = lower.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if(dayMatch) return `Next ${dayMatch[0]}`;
    
    return 'No deadline';
};

const extractActionItems = (transcriptChunk) => {
    const sentences = transcriptChunk.match(/[^.?!]+[.?!]+/g) || [transcriptChunk];
    const actionItems = [];

    // Names can be uppercase words (naive extraction for MVP)
    const nameRegex = /\b[A-Z][a-z]+\b/g;

    sentences.forEach(sentence => {
        let text = sentence.toLowerCase();
        
        // Patterns for different sentence structures (Direct and Implicit)
        const patterns = [
            { regex: /([a-z]+)\s(?:will|is going to)\s(.*?)(\sby\s(.*))?$/i }, // direct
            { regex: /([a-z]+)\s(?:needs to|should|must)\s(.*?)(\sby\s(.*))?$/i }, // requirement
            { regex: /can\s([a-z]+)\s(.*?)(\sby\s(.*))?\?/i }, // implicit question "Can John do this?"
            { regex: /make sure\s([a-z]+)\s(.*?)(\sby\s(.*))?$/i } // delegating "make sure John does this"
        ];
        
        for (let p of patterns) {
            const match = text.match(p.regex);
            if (match) {
                // Ensure the extracted assignee might actually be a name by capitalizing it
                let assigneeRaw = match[1];
                let assignee = assigneeRaw.charAt(0).toUpperCase() + assigneeRaw.slice(1);
                
                // If the assignee is a pronoun like "I", "He", "She", skip or mark as Unassigned (unless speaker map is used)
                if (['I', 'We', 'He', 'She', 'They'].includes(assignee)) {
                    // Could map to speaker if we pass speaker context, for now Unassigned
                    assignee = 'Unassigned';
                }

                let taskRaw = match[2].trim();
                
                // MULTIPLE TASKS SPLITTING
                // If task contains "and", we split it to create two tasks assigned to the same person.
                const subTasks = taskRaw.split(/\sand\s/i);
                
                let rawDeadline = match[4] || text; // check whole sentence for deadline context if not explicitly after 'by'
                let deadline = inferDate(rawDeadline);
                
                subTasks.forEach(task => {
                    actionItems.push({
                        task: task.trim(),
                        assignee,
                        deadline
                    });
                });
                
                break; // move to next sentence if matched
            }
        }
    });

    // Remove duplicates
    const uniqueItems = Array.from(new Set(actionItems.map(a => a.task)))
        .map(task => actionItems.find(a => a.task === task));

    return uniqueItems;
};

module.exports = { extractActionItems };
