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
  type Application {
    createdAt: DateTime! @timestamp(operations: [CREATE])
    id: ID! @id
    inSets: [Set!]! @relationship(type: "CONTAINS", direction: IN)
    label: String!
    people: [Person!]! @relationship(type: "USES", direction: IN)
    hasSets: [Set!]! @relationship(type: "HAS", direction: OUT)
    updatedAt: DateTime! @timestamp(operations: [UPDATE])
  }
  union Entity = Application | Idea | Identity | Person | Set
  type Idea {
    createdAt: DateTime! @timestamp(operations: [CREATE])
    description: String!
    id: ID! @id
    inSets: [Set!]! @relationship(type: "CONTAINS", direction: IN)
    person: [Person!]! @relationship(type: "HAS", direction: IN)
    updatedAt: DateTime! @timestamp(operations: [UPDATE])
  }
  type Identity {
    createdAt: DateTime! @timestamp(operations: [CREATE])
    corroboratedIdentities: [Identity!]!
      @relationship(type: "CORROBORATES", direction: OUT)
    inSets: [Set!]! @relationship(type: "CONTAINS", direction: IN)
    label: String!
    person: [Person!]! @relationship(type: "HAS", direction: IN)
    type: String!
    # email, password, etc
    value: String!
    # secret | public
  }
  type Person {
    applications: [Application!]! @relationship(type: "USES", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    firstName: String!
    ideas: [Idea!]! @relationship(type: "HAS", direction: OUT)
    identities: [Identity!]! @relationship(type: "USES", direction: OUT)
    inSets: [Set!]! @relationship(type: "CONTAINS", direction: IN)
    lastName: String!
    updatedAt: DateTime! @timestamp(operations: [UPDATE])
  }
  type Set {
    application: [Application!]! @relationship(type: "HAS", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    id: ID! @id
    inSets: [Set!]! @relationship(type: "CONTAINS", direction: IN)
    label: String!
    entities: [Entity!]! @relationship(type: "CONTAINS", direction: OUT)
    updatedAt: DateTime! @timestamp(operations: [UPDATE])
  }
`;
const driver = neo4j.driver(neoUri, neo4j.auth.basic(neoUser, neoPass));
if (production !== "true") console.log(process.env, driver);

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

neoSchema.getSchema().then((schema) => {
  const server = new ApolloServer({
    schema: schema,
    introspection: production !== "true",
    csrfPrevention: true,
    cors: {
      origin: ["https://www.ecubed.ai", "https://www.ketari.io"],
    },
  });

  server.listen(port || 5000).then(({ url }) => {
    console.log(`GraphQL server ready on ${url}`);
  });
});
