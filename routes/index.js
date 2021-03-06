module.exports = function(app) {

  app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
    next();
  });

  app.use('/users', require('./users').router);
  app.use('/auth', require('./auth').router);
  app.use('/clusters', require('./clusters').router);
  app.use('/reddit', require('./reddit').router);
  app.use('/testing', require('./testing').router);
};
