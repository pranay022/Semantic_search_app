const express = require('express');
const app = express();
const routes = require('./src/routes/routes')
const { apiLimiter } = require('./src/middleware/ratelimiter');

require('dotenv').config();


app.use(express.json());

app.use('/v1', apiLimiter)
app.use('/v1', routes);

app.use((req, res) => {
    res.status(404).json({error: 'Route not found'});
})

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).json({error: 'Internal Server Error'})
})

const PORT = process.env.PORT || 3000;

app.listen( PORT, () => {
    console.log(`Server is running on ${PORT}`)
})