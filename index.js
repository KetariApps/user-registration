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
    applications: [Application!]! @relationship(type: "USES", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    email: String!
    firstName: String!
    lastName: String!
    updatedAt: DateTime! @timestamp(operations: [UPDATE])
  }
  type Application {
    createdAt: DateTime! @timestamp(operations: [CREATE])
    name: String! @unique
    people: [Person!]! @relationship(type: "USES", direction: IN)
    updatedAt: DateTime! @timestamp(operations: [UPDATE])
  }
`;
class BasicLogging {
  requestDidStart({ queryString, parsedQuery, variables }) {
    const query = queryString || print(parsedQuery);
    console.log(query);
    console.log(variables);
  }

  willSendResponse({ graphqlResponse }) {
    console.log(JSON.stringify(graphqlResponse, null, 2));
  }
}

const driver = neo4j.driver(neoUri, neo4j.auth.basic(neoUser, neoPass));
if (production !== "true") console.log(process.env, driver);

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

neoSchema.getSchema().then((schema) => {
  const server = new ApolloServer({
    schema: schema,
    introspection: production !== "true",
    extensions: production !== "true" && [() => new BasicLogging()],
  });

  server.listen(port || 5000).then(({ url }) => {
    console.log(`GraphQL server ready on ${url}`);
  });
});
