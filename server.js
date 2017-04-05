//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Add the required modules
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
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

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Set database connection
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const mongoose = require('mongoose');
const mongoStore = require('connect-mongo')(session);
const mongoConnectionLocal = 'mongodb://localhost:27017/fitness-marketapp-DB';
const mongoConnectionOnline = 'mongodb://fitness-marketapp-user:34dffYMoEjR9Wt1RK5H6DCOA9FCz40KU@ds119588.mlab.com:19588/fitness-marketapp-db';

mongoose.Promise = global.Promise;
mongoose.connect(mongoConnectionOnline, (err, database) => { if(err) { console.log(err); }});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Set port, view engine and session
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
app.set('port', process.env.PORT || 3001);

app.use(morgan('dev')); ///morgar is use for development to test what are the request and response that's being handle
app.use(cookieParser());
app.use(validator()); ///validator is a backend validator by express 
app.use(flash()); ///flash can be use to store messages or notification on session
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs'); ///Set the view engine to EJS
app.set('views', __dirname + '/views'); ///Set the views directory
app.use(express.static(__dirname));

///Get the bootstrap, jquery, and font-awesome inside the node_module 
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/fonts/', express.static(__dirname + '/node_modules/bootstrap/dist/fonts'));
app.use('/fonts/', express.static(__dirname + '/node_modules/font-awesome/fonts'));
app.use('/css/', express.static(__dirname + '/node_modules/font-awesome/css'));

///Set session and cookie max life, store session in mongo database
app.use(session({
		secret: "53BBCA1D5814C7342D9725AF82178",    
		resave: true,
	  	saveUninitialized: false, 
		store: new mongoStore({ mongooseConnection: mongoose.connection }),
		cookie: { maxAge: 60 * 60 * 1000}
}));

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Initialize Passport
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    next();
});

require('./config/trainer-authentication/passport');
require('./config/client-authentication/passport');

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Set Routes
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const TrainerRestrictedRoute = require('./app/routes/trainer/trainer-restricted');
const TrainerUnRestrictedRoute = require('./app/routes/trainer/trainer-not-restricted');
const ClientRoute = require('./app/routes/client/client-restricted');
const Gym = require('./app/routes/gym/gym');
const IndexRoute = require('./app/routes/index');

app.use('/', IndexRoute);
app.use('/trainer', TrainerRestrictedRoute);
app.use('/trainer', TrainerUnRestrictedRoute);
app.use('/client', ClientRoute);
app.use('/gym', Gym);

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Set Error Handler
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
app.use((req, res, next) => {
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

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Create Server
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
http.createServer(app).listen(app.get('port'), () => {
	console.log(`Server Listening to Port: ${app.get('port')}`);
})
