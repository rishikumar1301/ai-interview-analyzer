const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');




const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later."
})
app.use(limiter);
app.use(cors({
    origin: "https://ai-interview-analyzer-rishi-dev-ai.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(express.json());
app.use(cookieParser());
app.use(helmet());



/* require all routes here*/
const authRouter = require('./routes/auth.routes');
const interviewRouter = require('./routes/interview.routes');

/* use all routes here*/
app.use('/api/auth',authRouter)
app.use("/api/interview",interviewRouter)


module.exports = app;