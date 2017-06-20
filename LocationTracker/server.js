var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(8075, function(){
    console.log('Server running on 8075...');
});