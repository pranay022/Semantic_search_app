const express = require('express');
const rateLimit = require('express-rate-limit');


const apiLimiter =  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message:{
        status: 429,
        message: 'Too many requests from this IP, please try again after 10 minutes.'
    }
});

module.exports = { 
    apiLimiter,
}