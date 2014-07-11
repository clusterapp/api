module.exports = {
  INVALID_TOKEN: function() {
    return { error: 'invalid or missing token' };
  },
  MISSING_PARAM: function(p) {
    return { error: 'missing parameter: ' + p };
  },
  INVALID_PARAM: function(p) {
    return {
      error: 'parameter: ' + p + ' is not valid or does not match'
    };
  },
  NO_USER_FOUND: function() {
    return { error: 'no user found' };
  }
};
