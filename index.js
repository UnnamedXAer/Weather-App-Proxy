require('dotenv').config();
const http = require('http');
const express = require('express');
const createError = require('http-errors');
const cors = require('cors');
const app = express();
const api = require('./api');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOrigin = eval(process.env.CORS_URLS);
app.use(cors({
	origin: corsOrigin,
	credentials: true
}));

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.post('/call-api', async (req, res, next) => {
	const { queryParams, provider } = req.body;
	if (!queryParams || !provider) {
		res.status(400);
		return next(new Error('Wrong request: "provider" and "queryParams" parameters are required.'));
	}

	try {
		const data = await api[provider].getData(queryParams);
		if (data && data.error) {
			res.status(data.code || 400);
			return next(new Error(data.error));
		}
		res.status(data.code || 200).json(data.payload);
	}
	catch (err) {
		res.status(500);
		next(err);
	}
});

app.use((req, res, next) => {
	console.log(`[@${req.method}] ${req.url}`);
	next();
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	const error = req.app.get('env') === 'development' ? err : {};
	// console.log(req.app.get('env'));

	console.log(err);

	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = error;

	// render the error page
	res.status(err.status || res.statusCode || 500);
	res.json({
		message: err.message,
		error: error
	});
});

var port = normalizePort(process.env.PORT || '3031');
app.set('port', port);
var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	console.log('Server is listening. Port: ' + addr.port);
}

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}