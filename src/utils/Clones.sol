// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal EIP-1167 clone implementation (canonical layout)
library Clones {
    function clone(address implementation) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3)
            mstore(add(ptr, 0x14), 0x363d3d373d3d3d363d73)
            mstore(add(ptr, 0x28), shl(0x60, implementation))
            mstore(add(ptr, 0x3c), 0x5af43d82803e903d91602b57fd5bf3)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "CLONE_FAILED");
    }
}


