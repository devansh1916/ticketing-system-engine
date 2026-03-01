const express = require('express');
const db = require('./db');

const app= express();

app.use(express.json());

app.get('/check',(req,res) => {
    res.json({
        status:'API is running',
        time: new Date()
    })
})

app.post('/api/book',(req,res) => {
    const {userID , eventID} =req.body;
    res.json({
        message: "Booking initiated",
        recievedData: {userID,eventID}
    })
})

const PORT= process.env.API_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});


