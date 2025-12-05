// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ValidateModel} from "../type/ValidateModel.sol";

interface IValidationStrategy {
    struct VoteData {
        address voter;
        uint8 choice;
        uint256 nonce;
        bytes signature;
    }

    struct VerifyContext {
        address project;
        bytes32 projectId;
        bytes32 contributionId;
        bytes32 contributionHash;
        ValidateModel validateModel;
    }

    function verify(
        VerifyContext calldata context,
        VoteData[] calldata votes,
        bytes calldata extraData
    ) external;
}
