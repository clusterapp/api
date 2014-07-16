api
===

The API code for clusterapp

[![Build Status](https://travis-ci.org/clusterapp/api.svg?branch=master)](https://travis-ci.org/clusterapp/api)

# Endpoints

## Authentication with Reddit

#### GET `/auth/reddit?redirect=SITE_TO_REDIRECT_TO`
Takes a user to Reddit to authenticate and then redirects to `redirect`.

The redirect will include a query string: `?user_id=USER_ID&user_name=USER_NAME&token=USER_TOKEN`. `USER_TOKEN` is the token you'll need to pass back to the API for any further API requests. This is tied to the user's ID, and will work only with the authenticated user.

## User

####  GET `/users/?token=TOKEN&userId=USER_ID`

Given the user's reddit id and a token (given back to you in the authentication process), this will return you back an object representing the user:

```json
{
    "id": "abc1234",
    "lastActive": "Thu Jul 10 2014",
    "redditName": "mega_troll"
}
```

#### GET `/users/name?name=REDDIT_NAME`

Given the user's name, will give you back the user.

```json
{
    "id": "abc1234",
    "lastActive": "Thu Jul 10 2014",
    "redditName": "mega_troll"
}
```

#### POST `/users/updateLastActive?token=TOKEN&userId=USER_ID`

Updates the `lastActive` field on the user and returns the serialized user object.

```json
{
    "id": "abc1234",
    "lastActive": "Thu Jul 10 2014",
    "redditName": "mega_troll"
}
```

#### POST `/users/destroyToken?token=TOKEN&userId=USER_ID`

Destroys the token on the user, so any further requests with that token will fail.

#### GET `/users/clusters/own?token=TOKEN&userId=USER_ID`

Returns an array of clusters, each being one the user created.
```json
[{
  "id": "abc1234",
  "name": "foo",
  "createdAt": "Thu Jul 10 2014",
  "owner": { user_object }
  "public": "true",
  "subreddits": ["vim", "code"],
  "admins": [{ user_object }, { user_object }],
  "subscribers": [{ user_object }, { user_object }]
}, {...}]
```

#### GET `/users/clusters/admin?token=TOKEN&userId=USER_ID`

Returns an array of clusters, each being one the user is an admin of.

```json
[{
  "id": "abc1234",
  "name": "foo",
  "createdAt": "Thu Jul 10 2014",
  "owner": {...},
  "public": "true",
  "subreddits": ["vim", "code"],
  "admins": [...],
  "subscribers": [...]
}, {...}]
```

#### GET `/users/clusters/subscribed?token=TOKEN&userId=USER_ID`

Returns an array of clusters, each being one the user is subscribed to.

## Clusters

#### GET `/clusters/public`

Returns an array of all public clusters on the site.

#### GET `/clusters/?clusterId=CLUSTER_ID`

Given a cluster id, will return a serialized object representing the cluster:

```json
{
  "id": "abc1234",
  "name": "foo",
  "createdAt": "Thu Jul 10 2014",
  "owner": {...}
  "public": "true",
  "subreddits": ["vim", "code"],
  "admins": [{...}],
  "subscribers": [{...}]
}
```

If a cluster is private, you'll need to pass the user's ID and the user's token. This ID must be the ID of either the owner of the Cluster or one of the admins for data to be returned.

#### GET `/clusters/name?clusterRoute=CLUSTER_ROUTE`

Given a cluster route (for example `/jack/foo`), will return the cluster. Similarly to the GET `/clusters` method, if the cluster is private, you'll need to pass in a user ID and a user token.


#### POST `/clusters/create?userId=USER_ID&token=USER_TOKEN`

Creates a cluster. Should be passed a JSON string which is an object with the following properties:

```json
{
  "owner": USER_ID,
  "name": CLUSTER_NAME,
  "subreddits": [ CLUSTER_SUBREDDIT1, CLUSTER_SUBREDDIT2 ],
  "public": false
}
```

#### GET `/clusters/listing?userId=USER_ID&token=USER_TOKEN&clusterId=CLUSTER_ID`

Returns a listing for the given cluster ID, as long as the user is able to view the cluster. The `sorted` key will contain the items in the cluster in the sorted order.

```json
{
  "sorted": [ { title: "...", url: "..." }, ... ]
  ...other metadata
}
```

These requests are cached on an hourly basis. If you really want the non cached version, you can pass `SKIP_CACHE=true` as a parameter in the URL. The response will have a `fromCache` key set to true or false to tell you if the request came from a cache or not.

#### POST `/clusters/update?userId=USER_ID&token=USER_TOKEN&clusterId=CLUSTER_ID`

Given a JSON body of key value pairs, will update the cluster with the properties given. Returns the new cluster.

User must be either the owner or an admin of the cluster, or this will fail.

## Reddit

#### GET `/reddit/popular?limit=LIMIT&token=TOKEN&userId=USER_ID`

Returns a list of popular subreddits, limited by the `limit` param (default is 100).

```json
[
  {
    "title": "funny",
    ...
  }
]
```






