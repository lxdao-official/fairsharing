// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TestBase} from "../TestBase.sol";
import {console2} from "forge-std/console2.sol";
import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

contract SignatureComparisonTest is TestBase {
    using ECDSA for bytes32;

    function setUp() public override {
        super.setUp();
    }

    function test_compareSignatureGeneration() public {
        console2.log("\n=== Address Verification ===");
        console2.log("voter1 (from vm.addr):", voter1);
        console2.log("Expected from key 0x1111:", vm.addr(VOTER1_KEY));
        console2.log("Match:", voter1 == vm.addr(VOTER1_KEY));

        // Create project address for testing
        address projectAddress = address(createBasicProject());

        console2.log("\n=== Signing Parameters ===");
        console2.log("Project:", projectAddress);
        console2.log("ValidationStrategy:", address(validationStrategy));
        console2.logBytes32(PROJECT_ID);
        console2.logBytes32(CONTRIBUTION_ID_1);

        // Generate signature the same way as TestBase
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Fairsharing Vote")),
                keccak256(bytes("1")),
                block.chainid,
                address(validationStrategy)
            )
        );

        console2.log("\n=== Domain Separator ===");
        console2.logBytes32(domainSeparator);

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Vote(bytes32 projectId,bytes32 contributionId,address voter,uint8 choice,uint256 nonce)"),
                PROJECT_ID,
                CONTRIBUTION_ID_1,
                voter1,
                uint8(1),
                uint256(1)
            )
        );

        console2.log("\n=== Struct Hash ===");
        console2.logBytes32(structHash);

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        console2.log("\n=== Digest ===");
        console2.logBytes32(digest);

        // Sign
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(VOTER1_KEY, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        console2.log("\n=== Signature ===");
        console2.log("Length:", signature.length);
        console2.log("v:", v);
        console2.logBytes32(r);
        console2.logBytes32(s);

        // Recover
        address recovered = digest.recover(signature);

        console2.log("\n=== Recovery ===");
        console2.log("Recovered:", recovered);
        console2.log("Expected (voter1):", voter1);
        console2.log("Match:", recovered == voter1);

        assertTrue(recovered == voter1, "Signature recovery failed");
    }

    function test_validateWithRealStrategy() public {
        address projectAddress = createBasicProject();

        console2.log("\n=== Testing with Real Strategy ===");
        console2.log("Project:", projectAddress);
        console2.log("Strategy:", address(validationStrategy));
        console2.log("voter1:", voter1);

        // Check domain separator from strategy perspective
        bytes32 strategyDomain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(validationStrategy.DOMAIN_NAME())),
                keccak256(bytes(validationStrategy.DOMAIN_VERSION())),
                block.chainid,
                address(validationStrategy)
            )
        );

        console2.log("\n=== Strategy Domain ===");
        console2.logBytes32(strategyDomain);
        console2.log("DOMAIN_NAME:", validationStrategy.DOMAIN_NAME());
        console2.log("DOMAIN_VERSION:", validationStrategy.DOMAIN_VERSION());
    }
}
