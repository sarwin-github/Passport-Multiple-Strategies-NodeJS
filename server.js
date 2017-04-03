const express = require('express');
const session = require('express-session');
const validator = require('express-validator');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const morgan = require('morgan');

const passport = require('passport');
const http = require('http');
const app = express();

const mongoose = require('mongoose');
const mongoConnectionLocal = 'mongodb://localhost:27017/fitness-marketapp-DB';
const mongoConnectionOnline = 'mongodb://user:password@ds141490.mlab.com:41490/fitness-marketapp-DB';

mongoose.Promise = global.Promise;
mongoose.connect(mongoConnectionLocal, (err, database) => { if(err) { console.log(err); }});

app.set('port', process.env.PORT || 3001);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(validator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname));

app.use(session({
		secret: "53BBCA1D5814C7342D9725AF82178",    
		resave: true,
	  	saveUninitialized: false, 
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(morgan('dev'));

app.use((req, res, next) =>{
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err: {};

	res.status(err.status || 500);
	res.render('error');
});

http.createServer(app).listen(app.get('port'), () => {
	console.log(`Server Listening to Port: ${app.get('port')}`);
})
