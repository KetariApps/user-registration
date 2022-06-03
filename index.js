const { gql, ApolloServer } = require("apollo-server");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");
require("dotenv").config();
const port = process.env.PORT;
const neoUri = process.env.NEOURI;
const neoPass = process.env.NEOPASS;
const neoUser = process.env.NEOUSER;

const typeDefs = gql`
  type Person @node(label: "Person", additionalLabels: ["EmailList"]) {
    firstName: String!
    lastName: String!
    email: String!
    usesApplication: [Application!]! @relationship(type: "USES", direction: OUT)
  }
  type Application {
    name: String! @unique
  }
`;

const driver = neo4j.driver(neoUri, neo4j.auth.basic(neoUser, neoPass));

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

neoSchema.getSchema().then((schema) => {
  const server = new ApolloServer({
    schema: schema,
  });

  server.listen().then(({ url }) => {
    console.log(`GraphQL server ready on ${url}`);
  });
});
