api
===

The API code for clusterapp

[![Build Status](https://travis-ci.org/clusterapp/api.svg?branch=master)](https://travis-ci.org/clusterapp/api)

# Endpoints

## Authentication with Reddit

#### GET `/auth/reddit?redirect=SITE_TO_REDIRECT_TO`
Takes a user to Reddit to authenticate and then redirects to `redirect`.

The redirect will be passed a query string: `?data=USER_RAW_JSON&token=USER_TOKEN`. `USER_RAW_JSON` will be a stringified JSON object containing all the user's information. You should be able to give this to `JSON.parse` to get an object. `USER_TOKEN` is the token you'll need to pass back to the API for any further API requests.

## User

####  GET `/users/?token=TOKEN&id=USER_ID`

Given the user's reddit username and a token (given back to you in the authentication process), this will find or create a user in the database, and return you an object representing the user:

```json
{
    "id": "abc1234",
    "lastActive": "Thu Jul 10 2014",
    "redditName": "mega_troll"
}
```

#### POST `/users/updateLastActive?token=TOKEN&id=USER_ID`

Updates the `lastActive` field on the user and returns the serialized user object.

```json
{
    "id": "abc1234",
    "lastActive": "Thu Jul 10 2014",
    "redditName": "mega_troll"
}
```




