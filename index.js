const { gql, ApolloServer } = require("apollo-server");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");
require("dotenv").config();
const port = process.env.PORT;
const neoUri = process.env.NEOURI;
const neoPass = process.env.NEOPASS;
const neoUser = process.env.NEOUSER;
const production = process.env.PRODUCTION;

const typeDefs = gql`
  type Person @node(label: "Person", additionalLabels: ["EmailList"]) {
    firstName: String!
    lastName: String!
    email: String!
    applications: [Application!]! @relationship(type: "USES", direction: OUT)
  }
  type Application {
    name: String! @unique
    people: [Person!]! @relationship(type: "USES", direction: IN)
  }
`;

const driver = neo4j.driver(neoUri, neo4j.auth.basic(neoUser, neoPass));

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

neoSchema.getSchema().then((schema) => {
  const server = new ApolloServer({
    schema: schema,
    introspection: production !== "true",
  });

  server.listen().then(({ url }) => {
    console.log(`GraphQL server ready on ${url}`);
  });
});
