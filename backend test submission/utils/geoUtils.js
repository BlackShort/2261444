const geoip = require('geoip-lite');

function getGeolocation(ip) {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return {
            country: 'Unknown',
            region: 'Unknown',
            city: 'Unknown',
            coordinates: {
                lat: 0,
                lon: 0
            }
        };
    }

    const geo = geoip.lookup(ip);
    
    if (!geo) {
        return {
            country: 'Unknown',
            region: 'Unknown',
            city: 'Unknown',
            coordinates: {
                lat: 0,
                lon: 0
            }
        };
    }

    return {
        country: geo.country || 'Unknown',
        region: geo.region || 'Unknown', 
        city: geo.city || 'Unknown',
        coordinates: {
            lat: geo.ll ? geo.ll[0] : 0,
            lon: geo.ll ? geo.ll[1] : 0
        }
    };
}


function extractReferrer(referrer) {
    if (!referrer) return 'direct';
    
    try {
        const url = new URL(referrer);
        return url.hostname;
    } catch {
        return 'direct';
    }
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
}

module.exports = {
    getGeolocation,
    extractReferrer,
    getClientIP
};
