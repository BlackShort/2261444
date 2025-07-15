const crypto = require('crypto');

function generateShortcode(length = 6) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        const randomByte = crypto.randomBytes(1)[0];
        result += alphabet[randomByte % alphabet.length];
    }
    
    return result;
}

function calculateExpiryDate(validityMinutes = 30) {
    const now = new Date();
    return new Date(now.getTime() + validityMinutes * 60 * 1000);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}


function isValidShortcode(shortcode) {
    if (!shortcode || typeof shortcode !== 'string') {
        return false;
    }
    return /^[a-zA-Z0-9_-]{1,20}$/.test(shortcode);
}


function sanitizeShortcode(shortcode) {
    if (!shortcode) return '';
    return shortcode.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

module.exports = {
    generateShortcode,
    calculateExpiryDate,
    isValidUrl,
    isValidShortcode,
    sanitizeShortcode
};
