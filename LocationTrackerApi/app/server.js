var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var NodeGeocoder = require('node-geocoder');

mongoose.connect('mongodb://localhost/locationtracker');
var jwt    = require('jsonwebtoken'); 
var config = require('./config'); 
var User   = require('./models/user'); 
var Location   = require('./models/location'); 


var cors = require('cors')

var app = express()
app.use(cors())

var port = process.env.PORT || 8080; 

app.set('secretKey', config.secret); 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});


var apiRoutes = express.Router(); 

apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    username: req.body.details.username
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      var user = new User({ 
        username: req.body.details.username, 
        password: req.body.details.password 
      });

      user.save(function(err) {
        if (err) throw err;

        var token = jwt.sign(user, app.get('secretKey'), {
          expiresIn: 1440 
        });

        res.json({ success: true, message: 'User Saved Successfully', data:{id: user.id, email: user.username} , token: token});
      }); 
    } else if (user) {
      if (user.password != req.body.details.password) {
        res.json({ success: false, message: 'Invalid password.' });
      } else {

        var token = jwt.sign(user, app.get('secretKey'), {
          expiresIn: 1440 
        });

        res.json({ success: true, message: 'Signed In Successfully', data:{id: user.id, email: user.username }, token: token });  
      }   

    }

  });
});


apiRoutes.use(function(req, res, next) {

  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {

    jwt.verify(token, app.get('secretKey'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });

  }
});




apiRoutes.post('/location', function(req, res) {
  var options = {
    provider: 'google'
  };

  var geocoder = NodeGeocoder(options);
 

  geocoder.geocode(req.body.details, function(err, resp) {
    var location = new Location({
        user: req.body.user, 
        location: req.body.details,
        latitude: resp[0].latitude,
        longitude: resp[0].longitude,
        street:resp[0].streetName,
        city: resp[0].city,
        zipcode: resp[0].zipcode,
        state: resp[0].administrativeLevels.level1long,
        country: resp[0].country
    });

    location.save(function(err) {
      if (err) throw err;

    
      res.json({ success: true, message: 'Location saved successfully' });
    });
  });
    
});


apiRoutes.get('/locationlist', function(req, res){
  Location.find( { user: req.query.details }, function(err, location){
    if(err){ return next(err);}
      res.json(location);
  });
});

app.use('/api', apiRoutes);

app.listen(port);
console.log('Server Running at http://localhost:' + port);
