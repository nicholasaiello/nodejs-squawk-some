'use sctrict';

const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

const app = require('./app');
const { graphqlTwitterSearch } = require('./helpers/streams');

const schema = buildSchema(`

  type Query {
    twitterSearch(query: String!, sinceId: Int, limit: Int): TwitterSearch
    stockSearch(query: String!): Stock
  }

  type TwitterSearch {
    results: TwitterResults
  }

  type TwitterResults {
    meta: TwitterMeta
    posts: [TwitterPost]
  }

  type TwitterMeta {
    count: Int
    sinceId: Int
  }

  type TwitterPost {
    id: String!
    text: String!
    user_name: String
    user_screen_name: String
    user_profile_img: String
    created_at: String
  }

  type Stock {
    symbol: String!
    updated: String
    tz: String
    open: Float
    high: Float
    low: Float
    close: Float
  }

`);

class ContextObject {
  getContext() {
    return this.context;
  }

  setContext(context = {}) {
    this.context = context;
  }
}

class TwitterResults extends ContextObject {
  constructor({ query = null, sinceId = 0, limit = 50 }) {
    super();
    this.query = query;
    this.sinceId = sinceId;
    this.limit = limit;
  }

  async results() {
    const { twitterClient, redisClient } = this.context;
    const params = {
      q: this.query,
      since: this.sinceId
    };

    return await graphqlTwitterSearch(params, twitterClient, redisClient);
  }

}

// The root provides a resolver function for each API endpoint
const resolvers = {
  twitterSearch: (args, context) => {
    const obj = new TwitterResults(args);
    obj.setContext(context);
    return obj;
  },
  stockSearch: (args, context) => {
    return {symbol: args.query};
  }
};

app.use('/graphql', graphqlHTTP((req) => {
    const { twitterClient, redisClient } = req;

    return {
      schema,
      rootValue: resolvers,
      context: {
        twitterClient,
        redisClient
      },
      graphiql: true
    }
  })
);

module.exports = graphqlHTTP;
