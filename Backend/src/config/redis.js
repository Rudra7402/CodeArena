const { createClient } = require('redis');

const redisclient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-10613.crce276.ap-south-1-3.ec2.cloud.redislabs.com',
        port: 10613
    }
});

module.exports = redisclient;