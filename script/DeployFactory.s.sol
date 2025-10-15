// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {Factory} from "../src/Factory.sol";

contract DeployFactory is Script {
    // Base Sepolia chain id 84532
    address constant USDC_BASE_SEPOLIA = 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f;
    address constant AAVE_POOL_BASE_SEPOLIA = 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        Factory factory = new Factory(USDC_BASE_SEPOLIA, AAVE_POOL_BASE_SEPOLIA, msg.sender);
        vm.stopBroadcast();
        console2.log("Factory:", address(factory));
    }
}
