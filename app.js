var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLmit = require('express-rate-limit');

var app = express();
var server = http.createServer(app);

const limiter = rateLmit({
    windowMs: 20 * 70 * 1000,
    max: 100
});

var db = new sqlite3.Database('./database/employees.db');

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, './public')));
app.use(helmet());
app.use(limiter);

// Create the Table if it does not exists in the DB
db.run('CREATE TABLE IF NOT EXISTS emp (id TEXT, name TEXT)');
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, './public/index.html'));
});

//Insert a record
app.post('/add', function(req, res){
    db.serialize(() => {
        db.run('INSERT INTO emp(id, name) VALUES (?, ?)', [req.body.id, req.body.name], function(err){
            if (err){
                return console.log(err.message);
            }
            console.log('New User information has been added!');
            res.send("The new user information has been inserted into the DB with the user ID = " + req.body.id + " and the name = " + req.body.name);
        });
    });
});

//Search for user information
app.post('/view', function(req,res){
    db.serialize(()=>{
        db.each('SELECT id ID, name NAME FROM emp WHERE id = ?', [req.body.id], function(err,row){
            res.send("Error encountered while looking for id");
            return console.error(err.message);
        });
        res.send(`ID: ${row.ID}, Name: ${row.NAME}`);
        console.log('DB entry displayed succesfully!');
    })
});

//Update user's information
app.post('/update', function(req, res){
    db.serialize(() => {
        db.run('UPDATE emp SET name = ? WHERE id = ?', [req.body.name, req.body.id], function(err){
            if(err){
                res.send('Error has been encountered while the data was been updated.');
                return console.error(err.message);
            }
            res.send("DB entry has been updated successfully!");
            console.log("Entry updated successfully.");
        });
    });
});

//Delete user information
app.post('/delete', function(req, res){
    db.serialize(()=>{
        db.run('DELETE FROM emp WHERE id = ?', req.body.id, function(err){
            if(err){
                res.send('');
                return console.error(err.message);
            }
            res.send('User information Deleted');
            console.log('User Entry has been deleted successfully.');
        });
    });
});

server.listen(3000, function(){
    console.log('Server is running in http://localhost:3000');
});