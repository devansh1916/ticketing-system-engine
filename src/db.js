import 'dotenv/config';
import pg from 'pg';
import {createClient} from 'redis';

const redisClient = createClient();

redisClient.on('error', err => console.log("Redis error",error));

await redisClient.connect();

const {Pool} = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,      
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('error',(err,client)=> {
    console.log('Unexpected Error',err)
    process.exit(-1);
})

async function CheckConnection() {
    try {
        const res= await pool.query('SELECT NOW()');
        console.log("Connection Succesful");
        console.log(res.rows[0]);
    }
    catch (e) {
        console.log("Connection failed",e.stack);
    }
}

CheckConnection();

export default { 
    pool,
    redisClient,
 };
