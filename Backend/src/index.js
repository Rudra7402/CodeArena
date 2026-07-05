const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter = require("./routers/userAuth")
const redisclient = require("./config/redis");
const problemRouter = require("./routers/problemCreator");
const submitRouter = require("./routers/submit");
const aiRouter = require("./routers/aiChatting");
const cors = require('cors');
const videoRouter = require('./routers/videoCreator');
const paymentRouter = require('./routers/paymentRouter');


app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}))

app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);
app.use('/video', videoRouter);
app.use('/payment', paymentRouter);


const startServer = async () => {
    try {
        await main();   // connect to DB
        console.log("Connected to MONGODB Database successfully");

        await redisclient.connect();
        console.log("Connected to Redis Database successfully");

        app.listen(process.env.PORT, () => {
            console.log(`Server is listening at port ${process.env.PORT}`);
        });

    } catch (err) {
        console.log("Error Occurred: " + err.message);
    }
};

startServer();