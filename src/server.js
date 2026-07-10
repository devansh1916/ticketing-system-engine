import express from 'express';

import db from './db.js';
import { RedisClient } from 'redis';
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
    const pgclient= await db.pool.connect();
    const cacheKey = 'seat:${eventID}:${userID}'

    //Redis Check
    try {
        const cacheSeat = await redisClient.hGetAll(cacheKey)
        if(cacheSeat && Object.keys(cacheSeat).length > 0) {
            const seat = cacheSeat;
            console.log("CACHE HIT!")
            return res.json({
                message: "Ticket is in cart! (Through Redis)",
                seat: cacheSeat,
                instructions:`You have ${10} minutes to complete payment`
            });
        }
    }
    catch (e) {
        console.log("Unexpected Redis Error",e)
    }
    try {
        await pgclient.query('BEGIN');
        const findQuery=` 
                SELECT id, row_letter, seat_number 
                FROM seats 
                WHERE event_id=$1
                AND
                ( status='AVAILABLE'
                OR
                (status='HELD' AND expire_time <=NOW())
                ) 
                LIMIT 1 
                FOR UPDATE SKIP LOCKED `;
        const { rows } = await pgclient.query(findQuery,[eventID])
        if (rows.length === 0) {
                await pgclient.query('ROLLBACK')
                return res.status(404).json({ error: "Sorry, this event is sold out!" })
        }
        const seat=rows[0];


        const holdDuration=10
        const expire_time=new Date(Date.now()+holdDuration*60000)


        const upadateQuery=`
        UPDATE seats
        SET status='HELD' ,holder_id=$1,expire_time=$2
        WHERE id=$3
        RETURNING *
        ` 
        const { rows : updatedRows} = await pgclient.query(upadateQuery,[userID,expire_time,seat.id]);
        const finalSeat = updatedRows[0];
        
        await pgclient.query('COMMIT');

        
        await redisClient.hSet(cacheKey, {...finalSeat,expire_time : finalSeat.expire_time.toISOString()})
        await redisClient.expire(cacheKey, 600);

        res.json({
            message: "Ticket is in cart!",
            seat: `Row ${seat.row_letter}, Seat ${seat.seat_number}`,
            status:`Held`,
            expiresAt: expire_time.toLocaleString(undefined, { 
                weekday: 'short', 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            }),
            instructions:`You have ${holdDuration} minutes to complete payment`
        });
    }
    catch(error) {
        await pgclient.query('ROLLBACK');
        console.log('Booking error:',error);
        res.status(500).json({ error: "Internal server error during booking." });
    }
    finally {
        pgclient.release();
    }
})

const PORT = process.env.API_PORT || 3000;

process.on('SIGINT', async () => {
    console.log("Stopping server...");

    await redisClient.quit(); 
    
    process.exit(0);
});

setInterval(async () => {
    try {
        const releaseQuery = `
            UPDATE seats 
            SET status = 'AVAILABLE', holder_id = NULL, expire_time = NULL 
            WHERE status = 'HELD' AND expire_time <= NOW()
            RETURNING id, row_letter, seat_number;
        `;
        
        const { rows } = await db.pool.query(releaseQuery);
        
        if (rows.length > 0) {
            console.log(` Released ${rows.length} expired seats back to the public pool.`);
            rows.forEach(seat => console.log(`   - Freed up Row ${seat.row_letter}, Seat ${seat.seat_number}`));
        }
    } catch (error) {
        console.error("Unkown Release Error", error);
    }
}, 60000);
app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});


