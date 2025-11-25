// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Project} from "../project/Project.sol";
import {ValidateModel} from "../type/ValidateModel.sol";
import {ContributionModel} from "../type/ContributionModel.sol";
import {ContributionStorage} from "../storage/ContributionStorage.sol";

contract ProjectFactory {
    error ProjectFactory__NotOwner();
    error ProjectFactory__ImplementationZero();
    error ProjectFactory__ImplementationNotContract();
    error ProjectFactory__NewOwnerZero();
    error ProjectFactory__ProjectOwnerZero();
    error ProjectFactory__ProjectIdZero();
    error ProjectFactory__ProjectNameEmpty();
    error ProjectFactory__ValidationStrategyZero();
    error ProjectFactory__ImplementationUnset();

    struct CreateProjectParams {
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
        address shareTokensAddress;
        address treasuryAddress;
        address[] admins;
        address[] members;
        address[] voters;
    }

    address private _projectImplementation;
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ProjectImplementationUpdated(address indexed previousImplementation, address indexed newImplementation);
    event ProjectCreated(
        address indexed proxy,
        address indexed implementation,
        address projectOwner,
        address creator,
        string name
    );

    constructor() {
        _owner = msg.sender;
        address implementation = address(new Project());
        _projectImplementation = implementation;
        emit OwnershipTransferred(address(0), msg.sender);
        emit ProjectImplementationUpdated(address(0), implementation);
    }

    modifier onlyOwner() {
        if (msg.sender != _owner) {
            revert ProjectFactory__NotOwner();
        }
        _;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function projectImplementation() public view returns (address) {
        return _projectImplementation;
    }

    function setProjectImplementation(address newImplementation) external onlyOwner {
        if (newImplementation == address(0)) {
            revert ProjectFactory__ImplementationZero();
        }
        if (newImplementation.code.length == 0) {
            revert ProjectFactory__ImplementationNotContract();
        }
        address previous = _projectImplementation;
        _projectImplementation = newImplementation;
        emit ProjectImplementationUpdated(previous, newImplementation);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert ProjectFactory__NewOwnerZero();
        }
        address previous = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(previous, newOwner);
    }

    function createProject(CreateProjectParams calldata params) external returns (address projectProxy) {
        if (params.projectOwner == address(0)) {
            revert ProjectFactory__ProjectOwnerZero();
        }
        if (params.projectId == bytes32(0)) {
            revert ProjectFactory__ProjectIdZero();
        }
        if (bytes(params.name).length == 0) {
            revert ProjectFactory__ProjectNameEmpty();
        }
        if (params.validationStrategy == address(0)) {
            revert ProjectFactory__ValidationStrategyZero();
        }

        address implementation = _projectImplementation;
        if (implementation == address(0)) {
            revert ProjectFactory__ImplementationUnset();
        }
        if (implementation.code.length == 0) {
            revert ProjectFactory__ImplementationNotContract();
        }

        projectProxy = address(new ERC1967Proxy(implementation, ""));
        uint256 numericId = uint256(uint160(projectProxy));
        ContributionStorage contributionStorageContract = new ContributionStorage(projectProxy, params.projectId);

        Project.InitParams memory initParams;
        initParams.id = numericId;
        initParams.projectId = params.projectId;
        initParams.projectOwner = params.projectOwner;
        initParams.name = params.name;
        initParams.metadataUri = params.metadataUri;
        initParams.extraData = params.extraData;
        initParams.orgAddress = params.orgAddress;
        initParams.validateModel = params.validateModel;
        initParams.contributionModel = params.contributionModel;
        initParams.validationStrategy = params.validationStrategy;
        initParams.votingStrategy = params.votingStrategy;
        initParams.contributionStorage = address(contributionStorageContract);
        initParams.shareTokensAddress = params.shareTokensAddress;
        initParams.treasuryAddress = params.treasuryAddress;
        initParams.admins = params.admins;
        initParams.members = params.members;
        initParams.voters = params.voters;

        Project(projectProxy).initialize(initParams);

        emit ProjectCreated(projectProxy, implementation, params.projectOwner, msg.sender, params.name);
    }
}
