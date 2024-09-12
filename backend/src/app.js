var fs = require('fs');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, {
  cors: {
    origin: "*"
  }
});
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var utils = require('./lib/utils');

// Get configuration
var env = process.env.NODE_ENV || 'dev';
const config = require('./configuration/configuration.json');
global.__basedir = __dirname;

// Database connection
var mongoose = require('mongoose');
// Use native promises
mongoose.Promise = global.Promise;
// Trim all Strings
mongoose.Schema.Types.String.set('trim', true);

mongoose.connect(`mongodb://mongodb:27017/pwndoc`, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models import
require('./models/user');
require('./models/audit');
require('./models/client');
require('./models/company');
require('./models/template');
require('./models/vulnerability');
require('./models/vulnerability-update');
require('./models/language');
require('./models/audit-type');
require('./models/vulnerability-type');
require('./models/vulnerability-category');
require('./models/custom-section');
require('./models/custom-field');
require('./models/image');
require('./models/settings');

// Socket IO configuration
io.on('connection', (socket) => {
  socket.on('join', (data) => {
    console.log(`user ${data.username.replace(/\n|\r/g, "")} joined room ${data.room.replace(/\n|\r/g, "")}`);
    socket.username = data.username;
    do { socket.color = '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6); } while (socket.color === "#77c84e");
    socket.join(data.room);
    io.to(data.room).emit('updateUsers');
  });
  socket.on('leave', (data) => {
    console.log(`user ${data.username.replace(/\n|\r/g, "")} left room ${data.room.replace(/\n|\r/g, "")}`);
    socket.leave(data.room);
    io.to(data.room).emit('updateUsers');
  });
  socket.on('updateUsers', (data) => {
    var userList = [...new Set(utils.getSockets(io, data.room).map(s => {
      var user = {};
      user.username = s.username;
      user.color = s.color;
      user.menu = s.menu;
      if (s.finding) user.finding = s.finding;
      if (s.section) user.section = s.section;
      return user;
    }))];
    io.to(data.room).emit('roomUsers', userList);
  });
  socket.on('menu', (data) => {
    socket.menu = data.menu;
    (data.finding)? socket.finding = data.finding: delete socket.finding;
    (data.section)? socket.section = data.section: delete socket.section;
    io.to(data.room).emit('updateUsers');
  });
  socket.on('disconnect', () => {
    socket.broadcast.emit('updateUsers');
  });
});

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');
  next();
});

// CSP
app.use(function(req, res, next) {
  res.header("Content-Security-Policy", "default-src 'none'; form-action 'none'; base-uri 'self'; frame-ancestors 'none'; sandbox; require-trusted-types-for 'script';");
  next();
});

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({
  limit: '10mb',
  extended: false // do not need to take care about images, videos -> false: only strings
}));

app.use(cookieParser());

// Routes import
require('./routes/user')(app);
require('./routes/audit')(app, io);
require('./routes/client')(app);
require('./routes/company')(app);
require('./routes/vulnerability')(app);
require('./routes/template')(app);
require('./routes/vulnerability')(app);
require('./routes/data')(app);
require('./routes/image')(app);
require('./routes/settings')(app);

app.get("*", function(req, res) {
    res.status(404).json({"status": "error", "data": "Route undefined"});
});

// Start server
// Set defaults if config is missing
const host = config.host || '0.0.0.0';
const port = config.port || 4242;

// Start server
http.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});

module.exports = app;
