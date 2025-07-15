const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    sourceIP: {
        type: String,
        required: true
    },
    referrer: {
        type: String,
        default: 'direct'
    },
    userAgent: {
        type: String,
        required: true
    },
    geolocation: {
        country: String,
        region: String,
        city: String,
        coordinates: {
            lat: Number,
            lon: Number
        }
    }
});

const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                try {
                    new URL(v);
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'Invalid URL format'
        }
    },
    shortcode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9_-]{1,20}$/, 'Shortcode must be alphanumeric and between 1-20 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    validityMinutes: {
        type: Number,
        required: true,
        default: 30,
        min: 1
    },
    clicks: [clickSchema],
    clickCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

urlSchema.index({ shortcode: 1 });
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

urlSchema.methods.isExpired = function() {
    return new Date() > this.expiresAt;
};

urlSchema.methods.addClick = function(clickData) {
    this.clicks.push(clickData);
    this.clickCount = this.clicks.length;
    return this.save();
};

module.exports = mongoose.model('Url', urlSchema);
