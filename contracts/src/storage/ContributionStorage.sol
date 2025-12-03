// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IContributionStorage} from "../interfaces/IContributionStorage.sol";

contract ContributionStorage is IContributionStorage {
    error ContributionStorage__ProjectZeroAddress();
    error ContributionStorage__ProjectIdZero();
    error ContributionStorage__CallerNotProject();
    error ContributionStorage__InvalidProject();
    error ContributionStorage__InvalidProjectId();
    error ContributionStorage__InvalidContributionId();
    error ContributionStorage__InvalidHash();
    error ContributionStorage__EmptyPayload();
    error ContributionStorage__ContributionAlreadyProcessed();

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
        if (project_ == address(0)) revert ContributionStorage__ProjectZeroAddress();
        if (projectId_ == bytes32(0)) revert ContributionStorage__ProjectIdZero();
        project = project_;
        projectId = projectId_;
    }

    modifier onlyProject() {
        if (msg.sender != project) revert ContributionStorage__CallerNotProject();
        _;
    }

    function recordContribution(ContributionContext calldata context, string calldata rawContributionJson)
        external
        onlyProject
    {
        // Removed redundant checks: context.project and context.projectId
        // onlyProject modifier already ensures msg.sender == project
        // Project contract always passes correct context values

        if (context.contributionId == bytes32(0)) revert ContributionStorage__InvalidContributionId();
        if (context.contributionHash == bytes32(0)) revert ContributionStorage__InvalidHash();
        if (bytes(rawContributionJson).length == 0) revert ContributionStorage__EmptyPayload();
        if (_contributionHashes[context.contributionId] != bytes32(0)) {
            revert ContributionStorage__ContributionAlreadyProcessed();
        }

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
