import express from 'express';

import db, { Client } from './db.js';
db.pool.query('SELECT NOW()');

const app= express();

app.use(express.json());

app.get('/check',(req,res) => {
    res.json({
        status:'API is running',
        time: new Date()
    })
})

app.post('/api/book',async (req,res) => {
    const {userID , eventID} =req.body;
    const client= await db.pool.connect();
    try {
        await client.query('BEGIN');

        const findQuery=` 
            SELECT id, row_letter, seat_number 
            FROM seats 
            WHERE event_id = $1 AND status = 'AVAILABLE' 
            LIMIT 1 
            FOR UPDATE SKIP LOCKED
        `;
        const { rows } = await client.query(findQuery,[eventID]);
        if (rows.length === 0) {
            await client.query('ROLLBACK'); // Pop the bubble
            return res.status(404).json({ error: "Sorry, this event is sold out!" });
        }
        const seat=rows[0];

        const upadateQuery=`
        UPDATE seats
        SET status='SOLD' ,holder_id=$1
        WHERE id=$2
        RETURNING *
        ` 
        await client.query(upadateQuery,[userID,seat.id]);
        
        await client.query('COMMIT');

        res.json({
            message: "🎟️ Ticket booked successfully!",
            seat: `Row ${seat.row_letter}, Seat ${seat.seat_number}`
        });
    }
    catch(error) {
        await client.query('ROLLBACK');
        console.log('Booking error:',error);
        res.status(500).json({ error: "Internal server error during booking." });
    }
    finally {
        client.release();
    }
})

const PORT= process.env.API_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});


