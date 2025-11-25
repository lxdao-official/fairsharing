// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IContributionStorage {
    struct ContributionContext {
        address project;
        bytes32 projectId;
        bytes32 contributionId;
        bytes32 contributionHash;
        address submitter;
    }

    function recordContribution(
        ContributionContext calldata context,
        string calldata rawContributionJson
    ) external;
}
