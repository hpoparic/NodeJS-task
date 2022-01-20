import {list} from './list.js';
import fetch from 'node-fetch';
const accessToken = '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';

import {gql} from 'apollo-server';
const typeDefs = gql`
    type User {
      username: String!
      email: String
      searchedForCount: Int
      followerCount: Int!
      followingCount: Int!
    }

    type Query {
      users: [User!]!
      user(username: String!): User!
      mostSearched(limit: Int!): [User!]!
    }

    type Mutation {
      resetSearchedForCount: Int!
    }
`;

const resolvers = {
  Query: {
    users: () => {
      if (list.length > 0) {
        return list;
      }
    },
    user: (_, args) => {
      const q = `query {
      user(login: "${args.username}") {
      login
      email
      followers {
        totalCount
      }
      following {
        totalCount
      }}}`;
      fetch('https://api.github.com/graphql', {
        method: 'POST',
        body: JSON.stringify({q}),
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }).then((response) => response.text())
        .then((txt) => {
        const tmp = JSON.parse(txt);
        const userData = tmp["data"]["user"];
        var flag = 0;
        if (list.length > 0) {
          list.forEach((user) => {
          if (user.username === userData.login) {
            user.email = userData.email;
            user.searchedForCount = user.searchedForCount + 1;
            user.followerCount = userData.followers.totalCount;
            user.followingCount = userData.following.totalCount;
            flag = 1;
            return user;
            }
          })
        }
        if (flag === 0) {
            var newUser = {};
            newUser.username = userData.login;
            newUser.email = userData.email;
            newUser.searchedForCount = 1;
            newUser.followerCount = userData.followers.totalCount;
            newUser.followingCount = userData.following.totalCount;
            list.push(newUser);
            return newUser;
          }
      });
    },
    mostSearched: (_, args) => {
      list.sort((a, b) => b.searchedForCount - a.searchedForCount);
      var limitList = [];
      for (var i = 0; i < list.length && i < args.limit; i++) {
        limitList.push(list[i]);
      }
      return limitList;
    }
  },
  Mutation: {
    resetSearchedForCount: () => {
      if (list.length > 0) {
        list.forEach((user) => {
          user.searchedForCount = 0;
        })
      return 0;
      }
    }
  }
};

import {ApolloServer} from 'apollo-server';
const server = new ApolloServer({typeDefs, resolvers});
server.listen().then(({url}) => {
    console.log(`${url}`);
});