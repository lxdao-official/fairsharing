// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Initializable} from "openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {ValidateModel} from "../type/ValidateModel.sol";
import {ContributionModel} from "../type/ContributionModel.sol";
import {IValidationStrategy} from "../interfaces/IValidationStrategy.sol";
import {IContributionStorage} from "../interfaces/IContributionStorage.sol";
import {IProjectToken} from "../interfaces/IProjectToken.sol";

contract Project is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    error Project__IdZero();
    error Project__OwnerZero();
    error Project__ProjectIdZero();
    error Project__ValidationStrategyMissing();
    error Project__ContributionStorageMissing();
    error Project__ProjectIdMismatch();
    error Project__ContributionIdZero();
    error Project__ContributionHashZero();
    error Project__EmptyContributionPayload();
    error Project__CallerNotVoter();
    error Project__RewardRecipientZero();
    error Project__ZeroAddressRoleUpdate();

    uint256 private constant TOKEN_DECIMALS_MULTIPLIER = 1e18;

    struct InitParams {
        uint256 id;
        bytes32 projectId;
        address projectOwner;
        string metadataUri;
        address orgAddress;
        ValidateModel validateModel;
        ContributionModel contributionModel;
        address validationStrategy;
        address votingStrategy;
        address contributionStorage;
        address shareTokensAddress;
        address treasuryAddress;
        address[] admins;
        address[] contributors;
        address[] voters;
    }

    struct RoleUpdates {
        address[] addAdmins;
        address[] removeAdmins;
        address[] addContributors;
        address[] removeContributors;
        address[] addVoters;
        address[] removeVoters;
    }

    struct UpdateSettings {
        string metadataUri;
        ValidateModel validateModel;
        ContributionModel contributionModel;
        RoleUpdates roles;
    }

    // Storage layout optimized for gas efficiency
    uint256 private _id;
    bytes32 private _projectId;
    string private _metadataUri;

    // Packed into single slot (20 + 8 + 1 + 1 + 2 padding = 32 bytes)
    address private _orgAddress;                      // 20 bytes
    uint64 public initializedAt;                      // 8 bytes
    ValidateModel private _validateModel;             // 1 byte
    ContributionModel private _contributionModel;     // 1 byte

    // Address storage continues (each takes 1 slot)
    address private _validationStrategy;
    address private _votingStrategy;
    address private _contributionStorage;
    address private _shareTokensAddress;
    address private _treasuryAddress;

    mapping(address => bool) private _admins;
    mapping(address => bool) private _contributors;
    mapping(address => bool) private _voters;

    event ProjectInitialized(bytes32 indexed projectId, address indexed projectOwner, string metadataUri);
    event ProjectSettingsUpdated(
        bytes32 indexed projectId,
        string metadataUri,
        ValidateModel validateModel,
        ContributionModel contributionModel
    );
    event RoleUpdated(address indexed account, bool isAdmin, bool isContributor, bool isVoter);
    event ContributionSubmitted(
        bytes32 indexed projectId,
        bytes32 indexed contributionId,
        bytes32 contributionHash,
        address indexed submitter
    );

    constructor() {
        _disableInitializers();
    }

    function initialize(InitParams calldata params) external initializer {
        if (params.id == 0) revert Project__IdZero();
        if (params.projectOwner == address(0)) revert Project__OwnerZero();
        if (params.projectId == bytes32(0)) revert Project__ProjectIdZero();
        if (params.validationStrategy == address(0)) revert Project__ValidationStrategyMissing();
        if (params.contributionStorage == address(0)) revert Project__ContributionStorageMissing();
        __Ownable_init(params.projectOwner);

        _id = params.id;
        _projectId = params.projectId;
        _metadataUri = params.metadataUri;
        _orgAddress = params.orgAddress;
        _validateModel = params.validateModel;
        _contributionModel = params.contributionModel;
        _validationStrategy = params.validationStrategy;
        _votingStrategy = params.votingStrategy;
        _contributionStorage = params.contributionStorage;
        _shareTokensAddress = params.shareTokensAddress;
        _treasuryAddress = params.treasuryAddress;

        _seedRoles(params.projectOwner, params.admins, params.contributors, params.voters);

        initializedAt = uint64(block.timestamp);

        emit ProjectInitialized(params.projectId, params.projectOwner, params.metadataUri);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                READ INTERFACES
    //////////////////////////////////////////////////////////////////////////*/

    function id() external view returns (uint256) {
        return _id;
    }

    function projectId() external view returns (bytes32) {
        return _projectId;
    }

    function metadataUri() external view returns (string memory) {
        return _metadataUri;
    }

    function orgAddress() external view returns (address) {
        return _orgAddress;
    }

    function validateModel() external view returns (ValidateModel) {
        return _validateModel;
    }

    function contributionModel() external view returns (ContributionModel) {
        return _contributionModel;
    }

    function validationStrategy() external view returns (address) {
        return _validationStrategy;
    }

    function votingStrategy() external view returns (address) {
        return _votingStrategy;
    }

    function contributionStorage() external view returns (address) {
        return _contributionStorage;
    }

    function shareTokensAddress() external view returns (address) {
        return _shareTokensAddress;
    }

    function treasuryAddress() external view returns (address) {
        return _treasuryAddress;
    }

    function isAdmin(address account) external view returns (bool) {
        return _admins[account];
    }

    function isContributor(address account) external view returns (bool) {
        return _contributors[account];
    }

    function isVoter(address account) external view returns (bool) {
        return _voters[account];
    }

    function hasProcessedContribution(bytes32 contributionId_) external view returns (bool) {
        address contributionStorageAddress = _contributionStorage;
        if (contributionStorageAddress == address(0)) {
            return false;
        }
        return IContributionStorage(contributionStorageAddress).getContributionHash(contributionId_) != bytes32(0);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                UPDATE INTERFACES
    //////////////////////////////////////////////////////////////////////////*/

    function updateSettings(UpdateSettings calldata settings) external onlyOwner {
        _metadataUri = settings.metadataUri;
        _validateModel = settings.validateModel;
        _contributionModel = settings.contributionModel;

        _applyRoleUpdates(settings.roles);

        emit ProjectSettingsUpdated(_projectId, settings.metadataUri, settings.validateModel, settings.contributionModel);
    }

    function submitContribution(
        bytes32 projectId_,
        bytes32 contributionId,
        bytes32 contributionHash,
        IValidationStrategy.VoteData[] calldata votes,
        bytes calldata strategyData,
        address rewardRecipient,
        uint256 rewardAmount,
        string calldata rawContributionJson
    ) external {
        // Optimized validation order: check cheap parameters first
        if (contributionId == bytes32(0)) revert Project__ContributionIdZero();
        if (contributionHash == bytes32(0)) revert Project__ContributionHashZero();
        if (rewardRecipient == address(0)) revert Project__RewardRecipientZero();
        if (bytes(rawContributionJson).length == 0) revert Project__EmptyContributionPayload();

        // Then check storage (more expensive)
        if (!_voters[msg.sender]) revert Project__CallerNotVoter();
        if (projectId_ != _projectId) revert Project__ProjectIdMismatch();

        address validationStrategyAddress = _validationStrategy;
        if (validationStrategyAddress == address(0)) revert Project__ValidationStrategyMissing();

        address contributionStorageAddress = _contributionStorage;
        if (contributionStorageAddress == address(0)) revert Project__ContributionStorageMissing();

        IValidationStrategy(validationStrategyAddress).verify(
            IValidationStrategy.VerifyContext({
                project: address(this),
                projectId: _projectId,
                contributionId: contributionId,
                contributionHash: contributionHash,
                validateModel: _validateModel
            }),
            votes,
            strategyData
        );

        IContributionStorage(contributionStorageAddress).recordContribution(
            IContributionStorage.ContributionContext({
                project: address(this),
                projectId: _projectId,
                contributionId: contributionId,
                contributionHash: contributionHash,
                submitter: msg.sender
            }),
            rawContributionJson
        );

        _mintReward(rewardRecipient, rewardAmount);

        emit ContributionSubmitted(_projectId, contributionId, contributionHash, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                INTERNAL HELPERS
    //////////////////////////////////////////////////////////////////////////*/

    function _seedRoles(
        address ownerAddress,
        address[] calldata admins,
        address[] calldata contributors,
        address[] calldata voters
    ) private {
        _admins[ownerAddress] = true;
        _contributors[ownerAddress] = true;
        _voters[ownerAddress] = true;

        _updateRoleGroup(admins, true, _admins, false);
        _updateRoleGroup(contributors, true, _contributors, false);
        _updateRoleGroup(voters, true, _voters, false);
    }

    function _applyRoleUpdates(RoleUpdates calldata roles) private {
        _updateRoleGroup(roles.addAdmins, true, _admins, true);
        _updateRoleGroup(roles.removeAdmins, false, _admins, true);
        _updateRoleGroup(roles.addContributors, true, _contributors, true);
        _updateRoleGroup(roles.removeContributors, false, _contributors, true);
        _updateRoleGroup(roles.addVoters, true, _voters, true);
        _updateRoleGroup(roles.removeVoters, false, _voters, true);

        _ensureOwnerRoles();
    }

    function _updateRoleGroup(
        address[] calldata accounts,
        bool value,
        mapping(address => bool) storage roleMap,
        bool emitEvents
    ) private {
        uint256 length = accounts.length;
        for (uint256 i = 0; i < length;) {
            address account = accounts[i];
            if (account == address(0)) {
                revert Project__ZeroAddressRoleUpdate();
            }

            bool changed = _setRole(roleMap, account, value);
            if (changed && emitEvents) {
                _emitRoleSnapshot(account);
            }

            unchecked {
                ++i;
            }
        }
    }

    function _setRole(
        mapping(address => bool) storage roleMap,
        address account,
        bool value
    ) private returns (bool) {
        if (roleMap[account] == value) {
            return false;
        }

        roleMap[account] = value;
        return true;
    }

    function _ensureOwnerRoles() private {
        address ownerAddress = owner();

        // Cache storage reads to memory
        bool ownerIsAdmin = _admins[ownerAddress];
        bool ownerIsContributor = _contributors[ownerAddress];
        bool ownerIsVoter = _voters[ownerAddress];

        // Only update and emit if needed
        if (!ownerIsAdmin || !ownerIsContributor || !ownerIsVoter) {
            if (!ownerIsAdmin) _admins[ownerAddress] = true;
            if (!ownerIsContributor) _contributors[ownerAddress] = true;
            if (!ownerIsVoter) _voters[ownerAddress] = true;
            _emitRoleSnapshot(ownerAddress);
        }
    }

    function _emitRoleSnapshot(address account) private {
        emit RoleUpdated(account, _admins[account], _contributors[account], _voters[account]);
    }

    function _mintReward(address recipient, uint256 amount) private {
        // Check cheapest parameter first
        if (amount == 0) return;

        // Storage read (most expensive)
        address tokenAddress = _shareTokensAddress;
        if (tokenAddress == address(0)) return;

        unchecked {
            uint256 scaledAmount = amount * TOKEN_DECIMALS_MULTIPLIER;
            IProjectToken(tokenAddress).mint(recipient, scaledAmount);
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
