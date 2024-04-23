import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import * as assembly from "./pb/assembly";
import { Contract } from "../generated/schema";

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
