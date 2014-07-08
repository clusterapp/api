module.exports = function(app) {
  app.get('/', function(req, res){
    res.render('index', { title: 'Express' });
  });

  app.use('/users', require('./users').router);
};
