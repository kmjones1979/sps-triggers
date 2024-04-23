# Example of Substreams-powered subgraphs with triggers

## Substreams-powered subgraphs

Substreams is a framework for processing blockchain data, developed by StreamingFast for The Graph Network. A Substreams module can output entity changes, which are compatible with Subgraph entities using the graph_out module, bringing the indexing speed and additional data of Substreams to subgraph developers.

As of graph-node v0.34.0, developers can now use Substreams as source of triggers for Subgraphs which significantly enhances functionality by allowing the reuse of existing Substreams packages as an extraction layer and enabling access to more data sources. Developers can now directly run subgraph mappings on the data output from Substreams, facilitating a more integrated and efficient workflow. The differences in both of these approaches are outlined in the following two sections.

-   Cookbook Example: processing subgraph data using the graph_out module
-   Processing subgraph mappings with Substreams triggers

### Cookbook Example: Processing subgraph data using the graph_out module

See https://thegraph.com/docs/en/cookbook/substreams-powered-subgraphs/

### Triggers: Processing subgraph mappings with substreams triggers

In order to use Substreams triggers you will need a working Substreams package. The following steps outline how to upgrade the package to trigger AssemblyScript mappings..

To do this, start a new project and run graph init. Choose `substreams`, name the subgraph slug and define the directory to create the subgraph. This will prompt you to include the path to the spkg file you want to use for your triggers.

```
✔ Substreams network · mainnet
✔ SPKG file (path) · /Users/crashoverride/substreams-test-v1.0.1.spkg
  Generate subgraph
  Write subgraph to directory
✔ Create subgraph scaffold
✔ Initialize subgraph repository
✔ Install dependencies with yarn

Subgraph sps-triggers created in sps-triggers

Next steps:

  1. Run `graph auth` to authenticate with your deploy key.

  2. Type `cd sps-triggers` to enter the subgraph.

  3. Run `yarn deploy` to deploy the subgraph.

Make sure to visit the documentation on <https://thegraph.com/docs/> for further information.
```

Update subgraph.yaml with the following changes…

-   Update the moduleName key to the Substreams module you want to use as a trigger
-   Change the dataSources mapping kind key to the type `substreams/triggers`
-   Add the file key and define where the handlers will be executed (e.g. `./src/mapping.ts`)
-   Update the apiVersion key to `0.0.7` or higher
-   Define the handler (e.g. `handleContract`)

```
specVersion: 0.0.4
description: Ethereum Contract Tracking Subgraph (powered by Substreams) modified to use mappings triggers
repository: <https://github.com/graphprotocol/graph-tooling>
schema:
    file: schema.graphql
dataSources:
    - kind: substreams
      name: substream_test
      network: mainnet
      source:
          package:
              moduleName: map_contract # change this to the substreams module you want as a source
              file: substreams-test-v1.0.1.spkg
      mapping:
          kind: substreams/graph-entities
          file: ./src/mapping.ts # add the mapping containing the handlers
          apiVersion: 0.0.7 # upgrade the API version
          handler: handleContract
```

-   Add the proto buff configurations to your project. These should be placed in ./proto folder and named in the .proto extension See the (example.proto) described earlier in this guide.

```
syntax = "proto3";

package example;

message Contracts {
  repeated Contract contracts = 1;
}

message Contract {
    string address = 1;
    uint64 blockNumber = 2;
    string timestamp = 3;
    uint64 ordinal = 4;
}
```

-   Generate the AssemblyScript types

First run protoc from the existing protobuf definitions

> Note: You can install this tool using `yarn add https://github.com/mangas/protobuf-as`

```
protoc --plugin=./node_modules/protobuf-as/bin/protoc-gen-as --as_out=src/pb/ ./proto/*.proto
```

-   Create the Schema that will store the related entities

```
type Contract @entity {
    id: ID!

    "The timestamp when the contract was deployed"
    timestamp: String!

    "The block number of the contract deployment"
    blockNumber: BigInt!
}
```

-   Then use the graph-cli to generate types for GraphQL schema
    > Note: This will generate equally named types from the source protobufs, be aware there can sometimes be conflicting names (e.g. size). If needed you can simply comment out the source protobuf name that conflicts but you will lose access to this data in the AssemblyScript

```
graph codegen
```

Output:

```
✔ Apply migrations
✔ Load subgraph from subgraph.yaml
✔ Generate types for data source templates
✔ Load GraphQL schema from schema.graphql
  Write types to generated/schema.ts
✔ Generate types for GraphQL schema

Types generated successfully
```

-   Build the subgraph

```
graph build
```

Output:

```
✔ Apply migrations
✔ Load subgraph from subgraph.yaml
  Compile data source: sps-triggers => build/sps-triggers/sps-triggers.wasm
✔ Compile subgraph
  Copy schema file build/schema.graphql
  Write subgraph file build/sps-triggers/substreams-test-v1.0.1.spkg
  Write subgraph manifest build/subgraph.yaml
✔ Write compiled subgraph to build/

Build completed: build/subgraph.yaml
```

Here is an example AssemblyScript that will index all of the new contracts, just like the cookbook example does however it can be processed in AssemblyScript using triggers.

```
import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import * as assembly from "./pb/assembly";
import { Contract } from "../generated/schema";

g
export function handleContract(bytes: Uint8Array): void {
   let contracts = assembly.example.Contracts.decode(bytes.buffer);
   if (contracts.contracts.length == 0) {
       log.info("No contracts found", []);
       return;
   } else {
       // Loop through all contracts
       for (let i = 0; i < contracts.contracts.length; i++) {
           let contractInfo = contracts.contracts[i];
           let entity = new Contract(contractInfo.address.toString());
           entity.id = contractInfo.address.toString();
           entity.timestamp = contractInfo.timestamp;
           entity.blockNumber = BigInt.fromU64(contractInfo.blockNumber);
           entity.save();
       }
   }
}
```
