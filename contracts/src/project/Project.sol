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
    uint256 private constant TOKEN_DECIMALS_MULTIPLIER = 1e18;
    struct InitParams {
        uint256 id;
        bytes32 projectId;
        address projectOwner;
        string name;
        string metadataUri;
        bytes extraData;
        address orgAddress;
        ValidateModel validateModel;
        ContributionModel contributionModel;
        address validationStrategy;
        address votingStrategy;
        address contributionStorage;
        address shareTokensAddress;
        address treasuryAddress;
        address[] admins;
        address[] members;
        address[] voters;
    }

    uint256 private _id;
    bytes32 private _projectId;
    string private _name;
    string private _metadataUri;
    bytes private _extraData;
    uint64 public initializedAt;

    address private _orgAddress;
    ValidateModel private _validateModel;
    ContributionModel private _contributionModel;

    address private _validationStrategy;
    address private _votingStrategy;
    address private _contributionStorage;
    address private _shareTokensAddress;
    address private _treasuryAddress;

    address[] private _members;
    address[] private _admins;
    address[] private _voters;
    mapping(bytes32 => bool) private _processedContributions;

    event ProjectInitialized(
        bytes32 indexed projectId,
        address indexed projectOwner,
        string name,
        string metadataUri,
        bytes extraData
    );
    event ProjectNameUpdated(string previousName, string newName);
    event ProjectMetadataUriUpdated(string previousUri, string newUri);
    event ProjectExtraDataUpdated(bytes previousData, bytes newData);
    event OrgAddressUpdated(address indexed previousOrg, address indexed newOrg);
    event ValidateModelUpdated(ValidateModel previousModel, ValidateModel newModel);
    event ContributionModelUpdated(ContributionModel previousModel, ContributionModel newModel);
    event ValidationStrategyUpdated(address indexed previousStrategy, address indexed newStrategy);
    event VotingStrategyUpdated(address indexed previousStrategy, address indexed newStrategy);
    event ContributionStorageUpdated(address indexed previousAddress, address indexed newAddress);
    event ShareTokensAddressUpdated(address indexed previousAddress, address indexed newAddress);
    event TreasuryAddressUpdated(address indexed previousAddress, address indexed newAddress);
    event MemberAdded(address indexed account);
    event MemberRemoved(address indexed account);
    event AdminAdded(address indexed account);
    event AdminRemoved(address indexed account);
    event VoterAdded(address indexed account);
    event VoterRemoved(address indexed account);
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
        require(params.id != 0, "Project: id is zero");
        require(params.projectOwner != address(0), "Project: owner is zero address");
        require(bytes(params.name).length != 0, "Project: empty name");
        require(params.projectId != bytes32(0), "Project: projectId is zero");
        require(params.validationStrategy != address(0), "Project: validation strategy missing");
        require(params.contributionStorage != address(0), "Project: contribution storage missing");
        __Ownable_init(params.projectOwner);

        _id = params.id;
        _projectId = params.projectId;
        _name = params.name;
        _metadataUri = params.metadataUri;
        _extraData = params.extraData;
        _orgAddress = params.orgAddress;
        _validateModel = params.validateModel;
        _contributionModel = params.contributionModel;
        _validationStrategy = params.validationStrategy;
        _votingStrategy = params.votingStrategy;
        _contributionStorage = params.contributionStorage;
        _shareTokensAddress = params.shareTokensAddress;
        _treasuryAddress = params.treasuryAddress;
        _copyArray(params.admins, _admins);
        _copyArray(params.members, _members);
        _copyArray(params.voters, _voters);

        initializedAt = uint64(block.timestamp);

        emit ProjectInitialized(params.projectId, params.projectOwner, params.name, params.metadataUri, params.extraData);
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

    function name() external view returns (string memory) {
        return _name;
    }

    function metadataUri() external view returns (string memory) {
        return _metadataUri;
    }

    function extraData() external view returns (bytes memory) {
        return _extraData;
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

    function getMembers() external view returns (address[] memory) {
        return _members;
    }

    function getAdmins() external view returns (address[] memory) {
        return _admins;
    }

    function getVoters() external view returns (address[] memory) {
        return _voters;
    }

    function isAdmin(address account) external view returns (bool) {
        return _contains(_admins, account);
    }

    function isMember(address account) external view returns (bool) {
        return _contains(_members, account);
    }

    function isVoter(address account) external view returns (bool) {
        return _contains(_voters, account);
    }

    function hasProcessedContribution(bytes32 contributionId_) external view returns (bool) {
        return _processedContributions[contributionId_];
    }

    /*//////////////////////////////////////////////////////////////////////////
                                UPDATE INTERFACES
    //////////////////////////////////////////////////////////////////////////*/

    function addAdmin(address account) external onlyOwner {
        require(account != address(0), "Project: zero address");
        require(!_contains(_admins, account), "Project: already admin");
        _admins.push(account);
        emit AdminAdded(account);
    }

    function removeAdmin(address account) external onlyOwner {
        require(_removeAddress(_admins, account), "Project: admin not found");
        emit AdminRemoved(account);
    }

    function addMember(address account) external onlyOwner {
        require(account != address(0), "Project: zero address");
        require(!_contains(_members, account), "Project: already member");
        _members.push(account);
        emit MemberAdded(account);
    }

    function removeMember(address account) external onlyOwner {
        require(_removeAddress(_members, account), "Project: member not found");
        emit MemberRemoved(account);
    }

    function addVoter(address account) external onlyOwner {
        require(account != address(0), "Project: zero address");
        require(!_contains(_voters, account), "Project: already voter");
        _voters.push(account);
        emit VoterAdded(account);
    }

    function removeVoter(address account) external onlyOwner {
        require(_removeAddress(_voters, account), "Project: voter not found");
        emit VoterRemoved(account);
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
        require(projectId_ == _projectId, "Project: projectId mismatch");
        require(contributionId != bytes32(0), "Project: contributionId is zero");
        require(contributionHash != bytes32(0), "Project: contribution hash is zero");
        require(!_processedContributions[contributionId], "Project: contribution already processed");
        require(bytes(rawContributionJson).length != 0, "Project: empty contribution payload");
        require(_contains(_voters, msg.sender), "Project: caller not voter");
        require(rewardRecipient != address(0), "Project: reward recipient zero address");

        address validationStrategyAddress = _validationStrategy;
        require(validationStrategyAddress != address(0), "Project: validation strategy missing");

        address contributionStorageAddress = _contributionStorage;
        require(contributionStorageAddress != address(0), "Project: contribution storage missing");

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

        _processedContributions[contributionId] = true;

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

    function _copyArray(address[] calldata source, address[] storage target) private {
        uint256 length = source.length;
        for (uint256 i = 0; i < length; i++) {
            address account = source[i];
            if (account == address(0) || _contains(target, account)) {
                continue;
            }
            target.push(account);
        }
    }

    function _contains(address[] storage array, address account) private view returns (bool) {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == account) {
                return true;
            }
        }
        return false;
    }

    function _removeAddress(address[] storage array, address account) private returns (bool) {
        uint256 length = array.length;
        for (uint256 i = 0; i < length; i++) {
            if (array[i] == account) {
                array[i] = array[length - 1];
                array.pop();
                return true;
            }
        }
        return false;
    }

    function _mintReward(address recipient, uint256 amount) private {
        address tokenAddress = _shareTokensAddress;
        if (tokenAddress == address(0) || recipient == address(0) || amount == 0) {
            return;
        }
        uint256 scaledAmount = amount * TOKEN_DECIMALS_MULTIPLIER;
        IProjectToken(tokenAddress).mint(recipient, scaledAmount);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
