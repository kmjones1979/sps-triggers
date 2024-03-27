import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import * as assembly from "./pb/assembly";
import { Contract } from "../generated/schema";

export function handleContract(bytes: ArrayBuffer): void {
    log.info("Handling contract: {}", [bytes.toString()]);
    const contract = assembly.example.Contract.decode(bytes);

    if (contract.address == null) {
        return;
    } else {
        log.debug("Contract: {}", [contract.address.toString()]);

        if (Contract.load(contract.address) != null) {
            log.warning("Contract {} already exists", [
                contract.address.toString(),
            ]);
            return;
        } else {
            log.info("Creating entity for contract {}", [
                contract.address.toString(),
            ]);
            const contractEntity = new Contract(contract.address);

            log.info("Block number: {}", [contract.blockNumber.toString()]);
            log.info("Timestamp: {}", [contract.timestamp.toString()]);

            contractEntity.id = Bytes.fromHexString(contract.address).toHex();
            contractEntity.blockNumber = BigInt.fromU64(
                contract.blockNumber as u64
            );
            contractEntity.timestamp = contract.timestamp.toString();
            contractEntity.save();
        }
    }
}
