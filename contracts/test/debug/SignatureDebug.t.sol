// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";
import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {SimpleMajorityValidationStrategy} from "../../src/validation/SimpleMajorityValidationStrategy.sol";

contract SignatureDebugTest is Test {
    using ECDSA for bytes32;

    SimpleMajorityValidationStrategy public strategy;

    uint256 constant VOTER_KEY = 0x1111;
    address public voter;

    bytes32 constant PROJECT_ID = keccak256("test-project");
    bytes32 constant CONTRIBUTION_ID = keccak256("contribution-1");

    function setUp() public {
        strategy = new SimpleMajorityValidationStrategy();
        voter = vm.addr(VOTER_KEY);
        console2.log("Voter address:", voter);
    }

    function test_debugSignature() public view {
        // Step 1: Create domain separator
        bytes32 EIP712_DOMAIN_TYPEHASH = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

        bytes32 domainSeparator = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("Fairsharing Vote")),
                keccak256(bytes("1")),
                block.chainid,
                address(strategy)
            )
        );

        console2.log("Domain separator:");
        console2.logBytes32(domainSeparator);
        console2.log("Chain ID:", block.chainid);
        console2.log("Strategy address:", address(strategy));

        // Step 2: Create struct hash
        bytes32 VOTE_TYPEHASH = keccak256(
            "Vote(bytes32 projectId,bytes32 contributionId,address voter,uint8 choice,uint256 nonce)"
        );

        bytes32 structHash = keccak256(
            abi.encode(
                VOTE_TYPEHASH,
                PROJECT_ID,
                CONTRIBUTION_ID,
                voter,
                uint8(1), // PASS
                uint256(1) // nonce
            )
        );

        console2.log("\nStruct hash:");
        console2.logBytes32(structHash);

        // Step 3: Create digest
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        console2.log("\nDigest:");
        console2.logBytes32(digest);

        // Step 4: Sign
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(VOTER_KEY, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        console2.log("\nSignature components:");
        console2.log("v:", v);
        console2.logBytes32(r);
        console2.logBytes32(s);
        console2.log("Signature length:", signature.length);

        // Step 5: Recover
        address recovered = digest.recover(signature);
        console2.log("\nRecovered address:", recovered);
        console2.log("Expected address:", voter);
        console2.log("Match:", recovered == voter);
    }

    function test_signatureWithMakeAddr() public {
        // Test with makeAddr instead of vm.addr
        address testVoter = makeAddr("testVoter");
        console2.log("\nTesting with makeAddr:");
        console2.log("Address:", testVoter);

        // This won't work for signing since we don't have the private key
        // Just showing the address generation difference
    }

    function test_compareAddressGeneration() public {
        // Compare vm.addr vs makeAddr
        address addr1 = vm.addr(VOTER_KEY);

        console2.log("\nAddress Generation Comparison:");
        console2.log("vm.addr(0x1111):", addr1);

        // Calculate expected address manually
        console2.log("\nThis is the address we should use for signing");
    }
}
