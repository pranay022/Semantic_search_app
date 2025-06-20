
const { createClient } = require('redis')

const client = createClient();

client.on('error', (err) => console.log('Redis client error', err));

(async () => {
    await client.connect();
    console.log('Redis Client Connected')
})();

module.exports  = client