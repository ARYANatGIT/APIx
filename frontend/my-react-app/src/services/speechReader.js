/**
 * AirSetu MoSPI APIx - Web Speech Synthesis Reader Service
 * Intelligently extracts readable content from the active page view
 * and speaks aloud using native browser SpeechSynthesis.
 */

let activeUtterance = null;
let keepAliveTimer = null;
let sentenceQueue = [];
let currentIndex = 0;
let isCurrentlySpeaking = false;
let stateChangeListeners = new Set();

export function subscribeSpeechState(listener) {
  stateChangeListeners.add(listener);
  return () => stateChangeListeners.delete(listener);
}

function notifyState(isSpeaking, currentSentence = '') {
  isCurrentlySpeaking = isSpeaking;
  stateChangeListeners.forEach((fn) => {
    try {
      fn({ isSpeaking, currentSentence });
    } catch (e) {
      console.error('Error in speech state listener:', e);
    }
  });
}

/**
 * Clean & Format text for high-fidelity spoken output
 */
export function sanitizeTextForSpeech(rawText) {
  if (!rawText) return '';

  return rawText
    .replace(/\s+/g, ' ')
    // Currency & math
    .replace(/₹\s*([0-9,]+(\.[0-9]+)?)/g, '$1 Rupees')
    .replace(/%\s*/g, ' percent ')
    .replace(/×/g, ' multiplied by ')
    .replace(/∑/g, ' sum of ')
    .replace(/➔|→/g, ' to ')
    .replace(/•/g, ', ')
    // Standard airport corridor pairs to full city names
    .replace(/\bDEL-BOM\b/gi, 'Delhi to Mumbai')
    .replace(/\bDEL-BLR\b/gi, 'Delhi to Bengaluru')
    .replace(/\bBOM-BLR\b/gi, 'Mumbai to Bengaluru')
    .replace(/\bDEL-CCU\b/gi, 'Delhi to Kolkata')
    .replace(/\bBLR-HYD\b/gi, 'Bengaluru to Hyderabad')
    .replace(/\bMAA-DEL\b/gi, 'Chennai to Delhi')
    .replace(/\bDEL-HYD\b/gi, 'Delhi to Hyderabad')
    .replace(/\bBOM-GOI\b/gi, 'Mumbai to Goa')
    .replace(/\bBOM-MAA\b/gi, 'Mumbai to Chennai')
    .replace(/\bCCU-BLR\b/gi, 'Kolkata to Bengaluru')
    // Advance purchase horizons
    .replace(/\bT\+0\b/gi, 'T plus 0, same day booking')
    .replace(/\bT\+1\b/gi, 'T plus 1 day')
    .replace(/\bT\+7\b/gi, 'T plus 7 days')
    .replace(/\bT\+15\b/gi, 'T plus 15 days')
    .replace(/\bT\+30\b/gi, 'T plus 30 days')
    .replace(/\bT\+45\b/gi, 'T plus 45 days')
    // Official acronyms
    .replace(/\bMoSPI\b/g, 'M-O-S-P-I')
    .replace(/\bDGCA\b/g, 'D-G-C-A')
    .replace(/\bAPIx\b/g, 'A-P-I-x Airfare Index')
    .replace(/\bCPI\b/g, 'Consumer Price Index')
    .replace(/\bNSO\b/g, 'National Statistical Office')
    .replace(/\bPax\/yr\b/gi, 'passengers per year')
    .replace(/\bpax\b/gi, 'passengers')
    .replace(/\bIQR\b/gi, 'Interquartile Range')
    .replace(/\bOTAs\b/gi, 'Online Travel Agencies')
    .replace(/\bOTA\b/gi, 'Online Travel Agency')
    // Clean trailing or weird symbols
    .replace(/([0-9]+)\.([0-9]+)M\b/gi, '$1 point $2 Million')
    .replace(/([0-9]+)M\b/gi, '$1 Million')
    .replace(/([0-9]+)k\b/gi, '$1 Thousand')
    .replace(/\s*\.\s*/g, '. ')
    .replace(/\.{2,}/g, '.')
    .trim();
}

/**
 * Extract text from the active page container
 */
export function extractPageContent() {
  if (typeof document === 'undefined') return '';

  // Identify container based on active view
  const candidateSelectors = [
    '.home-simple-container',
    '.deck-white-dashboard',
    '.india-map-container',
    '.index-trend-container',
    '.windows-view-container',
    '.airlines-view-container',
    '.quotes-explorer-container',
    '.scraper-health-view',
    '.scraper-health-container',
    '.nso-export-container',
    '.harmont-content-area',
    '.harmont-viewport-frame'
  ];

  let container = null;
  for (const sel of candidateSelectors) {
    const el = document.querySelector(sel);
    if (el && el.offsetParent !== null) {
      container = el;
      break;
    }
  }

  if (!container) {
    container = document.querySelector('main') || document.body;
  }

  // Clone to avoid modifying live DOM
  const clone = container.cloneNode(true);

  // Remove non-spoken UI elements
  const IGNORE_SELECTORS = [
    '.left-sidebar-nav',
    '.sidebar-mobile-backdrop',
    '.mobile-app-header',
    '.airsetu-theme-toggle-group',
    '.volume-reader-btn',
    '.floating-page-reader',
    '.modal-backdrop',
    '.modal-close-btn',
    'svg',
    'script',
    'style',
    'noscript',
    '[aria-hidden="true"]',
    'input[type="checkbox"]'
  ];

  IGNORE_SELECTORS.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // Extract structured block items with natural punctuation pauses
  const items = [];
  const walk = (node) => {
    if (node.nodeType === 3) {
      // TEXT NODE
      const text = node.textContent.trim();
      if (text) items.push(text);
    } else if (node.nodeType === 1) {
      // ELEMENT NODE
      const tag = node.tagName.toLowerCase();
      const isBlock = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'li', 'tr', 'section', 'article', 'header'
      ].includes(tag);

      for (const child of node.childNodes) {
        walk(child);
      }

      if (isBlock && items.length > 0) {
        const last = items[items.length - 1];
        if (last && !/[.!?]$/.test(last)) {
          items.push('.');
        }
      }
    }
  };

  walk(clone);

  const raw = items.join(' ');
  return sanitizeTextForSpeech(raw);
}

/**
 * Split long text into manageable sentences
 */
function splitIntoSentences(text) {
  if (!text) return [];
  // Split on periods, exclamation marks, question marks
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter(p => p.trim().length > 0);
}

/**
 * Start speaking the active page text
 */
export function startPageReader() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    alert('Web Speech Synthesis is not supported in this browser.');
    return false;
  }

  // Stop any active speech
  stopPageReader();

  const extracted = extractPageContent();
  if (!extracted || extracted.length < 5) {
    const fallbackUtterance = new SpeechSynthesisUtterance("Welcome to AirSetu. Official MoSPI Airfare Price Index portal.");
    window.speechSynthesis.speak(fallbackUtterance);
    return true;
  }

  sentenceQueue = splitIntoSentences(extracted);
  currentIndex = 0;

  if (sentenceQueue.length === 0) return false;

  notifyState(true, sentenceQueue[0]);

  // Chrome 15-second speech synthesis pause bug workaround
  clearInterval(keepAliveTimer);
  keepAliveTimer = setInterval(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);

  speakNextSentence();
  return true;
}

function speakNextSentence() {
  if (currentIndex >= sentenceQueue.length) {
    stopPageReader();
    return;
  }

  const sentence = sentenceQueue[currentIndex];
  notifyState(true, sentence);

  const utterance = new SpeechSynthesisUtterance(sentence);
  activeUtterance = utterance;

  // Configure voice settings for clean professional articulation
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-IN'; // Default to Indian English if available, or browser falls back to default

  // Select best matching English voice if loaded
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => (v.lang === 'en-IN' || v.name.includes('India')) && !v.name.includes('Google'))
    || voices.find(v => v.lang.startsWith('en'))
    || null;

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onend = () => {
    currentIndex++;
    speakNextSentence();
  };

  utterance.onerror = (e) => {
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('SpeechSynthesis error:', e);
    }
    currentIndex++;
    if (currentIndex < sentenceQueue.length && e.error !== 'canceled') {
      speakNextSentence();
    } else {
      stopPageReader();
    }
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop active speech reader immediately
 */
export function stopPageReader() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  clearInterval(keepAliveTimer);
  keepAliveTimer = null;
  activeUtterance = null;
  sentenceQueue = [];
  currentIndex = 0;
  notifyState(false, '');
}

/**
 * Toggle speech reader (Start if idle, Stop if speaking)
 */
export function togglePageReader() {
  if (isCurrentlySpeaking) {
    stopPageReader();
    return false;
  } else {
    return startPageReader();
  }
}

export function getIsSpeaking() {
  return isCurrentlySpeaking;
}

