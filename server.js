const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');



//to run locally do: DATABASE_URL=$(heroku config:get DATABASE_URL -a enhanced-ctf) ./node_modules/nodemon/bin/nodemon.js server.js

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
        ssl: {
    rejectUnauthorized: false
  	}
});
const db = require('./db/dbExports');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('pages/index'));

app.get('/database', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM playerCoords');
        const results = {'results': (result) ? result.rows : null};

        res.render('pages/database', results);
        client.release();
    } catch (err) {
        console.error(err);
        res.send(JSON.stringify([]));
    }
});

app.get('/hello', (req, res) => {
    res.send("hello");
});

app.get('/giveMeCoords', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM playerCoords');
        const results = result.rows;    //Chengxi: I did this, just so I don't have to parse through the map before the list.
                                        //This way, the JSON just sends a lsit.
        client.release();
        res.send(JSON.stringify(results));
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.get('/createGame',db.createGame);
app.get('/getPlayersInGame',db.getPlayersInGame);
app.get('/getTeamsInfo',db.getTeamsInfoForGame);
app.get('/getTeammatesLocations',db.getTeammatesLocations);
app.get('/getEnemiesInViewRadius',db.getEnemiesInViewRadius);
app.get('/getMyTeamsFlags',db.getMyTeamsFlags)
app.get('/getGameRegions',db.getGameRegions)
app.get('/getClockInfo',db.getClockInfo);
//app.get('/getMapScreenInfo',db.getMapScreenInfo)
app.get('/getEnemyFlags',db.getEnemyFlags)
app.get('/getGameStarted',db.getGameStarted);
app.get('/getMyInfo',db.getMyInfo);
app.get('/attemptStealFlag',db.attemptStealFlag);

app.get('/moveflag',db.moveflag)

app.get('/attemptTagPlayer',db.attemptTagPlayer);
app.get('/getEndGameInfo',db.getEndGameInfo);
app.get('/attemptCookieGet',db.attemptCookieGet)
app.post('/startGame',db.startGame);
app.post('/joinGame',db.joinGame);
app.post('/deleteGame',db.deleteGame);
app.delete('/deleteMyGames',db.deleteMyGames);
app.post('/updatePlayerLocation',db.updatePlayerLocation);
//gets called whenever the user wants to set the game info
app.post('/setGameInfo',db.setGameInfo);
app.post('/generateCoinForGame', db.generateCoinForGame);
app.get('/getCoinsFromGame', db.getCoinsFromGame);
app.post('/playerGetGameCoin', db.playerGetGameCoin);

//postman
//heroku

app.post('/database', async (req, res) => {
    const query = "INSERT INTO playerCoords (deviceid, latitude, longitude) VALUES ($1, $2, $3) ON CONFLICT (deviceid) DO UPDATE SET latitude = $2, longitude = $3";
    const values = [req.body.deviceid, req.body.latitude, req.body.longitude];

    try {
        const client = await pool.connect();
        const result = await client.query(query, values);

        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }

    res.status(201).send("Success");
});

app.listen(PORT, function () {
    console.log("Listening on port", PORT);
});

app.get('*',(req,res)=>{
    res.status(404).send("Not Found");
})
app.post('*',(req,res)=>{
    res.status(404).send("You Cannot Post Here");
})

app.delete('*',(req,res)=>{
    res.status(404).send("Delete forbidden");
})
