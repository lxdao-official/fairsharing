// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IContributionStorage} from "../interfaces/IContributionStorage.sol";

contract ContributionStorage is IContributionStorage {
    address public immutable project;
    bytes32 public immutable projectId;
    mapping(bytes32 => bytes32) private _contributionHashes;

    event ContributionRecorded(
        address indexed project,
        bytes32 indexed projectId,
        bytes32 indexed contributionId,
        bytes32 contributionHash,
        address submitter,
        string rawContributionJson
    );

    constructor(address project_, bytes32 projectId_) {
        require(project_ != address(0), "ContributionStorage: project is zero address");
        require(projectId_ != bytes32(0), "ContributionStorage: projectId is zero");
        project = project_;
        projectId = projectId_;
    }

    modifier onlyProject() {
        require(msg.sender == project, "ContributionStorage: caller not project");
        _;
    }

    function recordContribution(ContributionContext calldata context, string calldata rawContributionJson)
        external
        onlyProject
    {
        require(context.project == project, "ContributionStorage: invalid project");
        require(context.projectId == projectId, "ContributionStorage: invalid projectId");
        require(context.contributionId != bytes32(0), "ContributionStorage: invalid contributionId");
        require(context.contributionHash != bytes32(0), "ContributionStorage: invalid hash");
        require(bytes(rawContributionJson).length != 0, "ContributionStorage: empty payload");

        _contributionHashes[context.contributionId] = context.contributionHash;

        emit ContributionRecorded(
            context.project,
            context.projectId,
            context.contributionId,
            context.contributionHash,
            context.submitter,
            rawContributionJson
        );
    }

    function getContributionHash(bytes32 contributionId) external view returns (bytes32) {
        return _contributionHashes[contributionId];
    }
}
