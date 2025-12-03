// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";
import {ProjectFactory} from "../src/factories/ProjectFactory.sol";
import {Project} from "../src/project/Project.sol";
import {SimpleMajorityValidationStrategy} from "../src/validation/SimpleMajorityValidationStrategy.sol";
import {ContributionStorage} from "../src/storage/ContributionStorage.sol";
import {ProjectToken} from "../src/token/ProjectToken.sol";
import {ValidateModel} from "../src/type/ValidateModel.sol";
import {ContributionModel} from "../src/type/ContributionModel.sol";
import {IValidationStrategy} from "../src/interfaces/IValidationStrategy.sol";

/**
 * @title TestBase
 * @notice Base contract for all tests with common setup and utilities
 */
abstract contract TestBase is Test {
    // Contracts
    ProjectFactory public factory;
    SimpleMajorityValidationStrategy public validationStrategy;

    // Private keys for signing (must be defined first)
    uint256 public constant VOTER1_KEY = 0x1111;
    uint256 public constant VOTER2_KEY = 0x2222;
    uint256 public constant VOTER3_KEY = 0x3333;

    // Test accounts
    address public owner = makeAddr("owner");
    address public projectOwner = makeAddr("projectOwner");
    address public voter1;  // Will be set from private key
    address public voter2;  // Will be set from private key
    address public voter3;  // Will be set from private key
    address public contributor1 = makeAddr("contributor1");
    address public contributor2 = makeAddr("contributor2");
    address public admin1 = makeAddr("admin1");
    address public treasury = makeAddr("treasury");

    // Test data
    bytes32 public constant PROJECT_ID = keccak256("test-project-1");
    bytes32 public constant CONTRIBUTION_ID_1 = keccak256("contribution-1");
    bytes32 public constant CONTRIBUTION_ID_2 = keccak256("contribution-2");
    bytes32 public constant CONTRIBUTION_HASH_1 = keccak256("contribution-hash-1");
    bytes32 public constant CONTRIBUTION_HASH_2 = keccak256("contribution-hash-2");

    // EIP-712 constants
    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant VOTE_TYPEHASH =
        keccak256("Vote(bytes32 projectId,bytes32 contributionId,address voter,uint8 choice,uint256 nonce)");

    function setUp() public virtual {
        // Derive voter addresses from private keys
        voter1 = vm.addr(VOTER1_KEY);
        voter2 = vm.addr(VOTER2_KEY);
        voter3 = vm.addr(VOTER3_KEY);

        vm.startPrank(owner);
        factory = new ProjectFactory();
        validationStrategy = new SimpleMajorityValidationStrategy();
        vm.stopPrank();

        // Fund test accounts
        vm.deal(owner, 100 ether);
        vm.deal(projectOwner, 100 ether);
        vm.deal(voter1, 10 ether);
        vm.deal(voter2, 10 ether);
        vm.deal(voter3, 10 ether);
        vm.deal(contributor1, 10 ether);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a basic project with default settings
     */
    function createBasicProject() internal returns (address) {
        address[] memory voters = new address[](3);
        voters[0] = voter1;
        voters[1] = voter2;
        voters[2] = voter3;

        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "Test Project",
            metadataUri: "ipfs://test-metadata",
            orgAddress: address(0),
            validateModel: ValidateModel.PUBLIC,
            contributionModel: ContributionModel.PUBLIC,
            validationStrategy: address(validationStrategy),
            votingStrategy: address(0),
            treasuryAddress: treasury,
            admins: emptyArray,
            contributors: emptyArray,
            voters: voters,
            tokenSymbol: "TEST"
        });

        return factory.createProject(params);
    }

    /**
     * @notice Create a project with full role setup
     */
    function createProjectWithRoles() internal returns (address) {
        address[] memory admins = new address[](2);
        admins[0] = admin1;
        admins[1] = voter1;

        address[] memory contributors = new address[](2);
        contributors[0] = contributor1;
        contributors[1] = contributor2;

        address[] memory voters = new address[](3);
        voters[0] = voter1;
        voters[1] = voter2;
        voters[2] = voter3;

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "Test Project with Roles",
            metadataUri: "ipfs://test-metadata-roles",
            orgAddress: address(0x123),
            validateModel: ValidateModel.VALIDATOR,
            contributionModel: ContributionModel.RESTRICTED,
            validationStrategy: address(validationStrategy),
            votingStrategy: address(0),
            treasuryAddress: treasury,
            admins: admins,
            contributors: contributors,
            voters: voters,
            tokenSymbol: "TROLE"
        });

        return factory.createProject(params);
    }

    /**
     * @notice Create a signed vote using EIP-712
     */
    function createSignedVote(
        address projectAddress,
        bytes32 projectId,
        bytes32 contributionId,
        address voter,
        uint256 voterPrivateKey,
        uint8 choice,
        uint256 nonce
    ) internal view returns (IValidationStrategy.VoteData memory) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("Fairsharing Vote")),
                keccak256(bytes("1")),
                block.chainid,
                projectAddress
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                VOTE_TYPEHASH,
                projectId,
                contributionId,
                voter,
                choice,
                nonce
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(voterPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        return IValidationStrategy.VoteData({
            voter: voter,
            choice: choice,
            nonce: nonce,
            signature: signature
        });
    }

    /**
     * @notice Create multiple votes
     */
    function createVotes(
        address projectAddress,
        bytes32 projectId,
        bytes32 contributionId,
        uint8 choice
    ) internal view returns (IValidationStrategy.VoteData[] memory) {
        IValidationStrategy.VoteData[] memory votes = new IValidationStrategy.VoteData[](3);

        votes[0] = createSignedVote(
            projectAddress,
            projectId,
            contributionId,
            voter1,
            VOTER1_KEY,
            choice,
            1
        );

        votes[1] = createSignedVote(
            projectAddress,
            projectId,
            contributionId,
            voter2,
            VOTER2_KEY,
            choice,
            2
        );

        votes[2] = createSignedVote(
            projectAddress,
            projectId,
            contributionId,
            voter3,
            VOTER3_KEY,
            choice,
            3
        );

        return votes;
    }

    /**
     * @notice Submit a contribution with votes
     */
    function submitContribution(
        Project project,
        bytes32 contributionId,
        bytes32 contributionHash,
        IValidationStrategy.VoteData[] memory votes,
        address submitter,
        address rewardRecipient,
        uint256 rewardAmount
    ) internal {
        vm.prank(submitter);
        project.submitContribution(
            PROJECT_ID,
            contributionId,
            contributionHash,
            votes,
            "",
            rewardRecipient,
            rewardAmount,
            '{"title":"Test Contribution","description":"This is a test contribution","author":"test-author"}'
        );
    }

    /**
     * @notice Get project info for assertions
     */
    function getProjectInfo(Project project) internal view returns (
        uint256 id,
        bytes32 projectId,
        string memory metadataUri,
        address orgAddress,
        ValidateModel validateModel,
        ContributionModel contributionModel
    ) {
        id = project.id();
        projectId = project.projectId();
        metadataUri = project.metadataUri();
        orgAddress = project.orgAddress();
        validateModel = project.validateModel();
        contributionModel = project.contributionModel();
    }

    /**
     * @notice Assert role membership
     */
    function assertRoles(
        Project project,
        address account,
        bool expectedAdmin,
        bool expectedContributor,
        bool expectedVoter
    ) internal {
        assertEq(project.isAdmin(account), expectedAdmin, "Admin role mismatch");
        assertEq(project.isContributor(account), expectedContributor, "Contributor role mismatch");
        assertEq(project.isVoter(account), expectedVoter, "Voter role mismatch");
    }

    /**
     * @notice Create empty role updates struct
     */
    function emptyRoleUpdates() internal pure returns (Project.RoleUpdates memory) {
        address[] memory empty = new address[](0);
        return Project.RoleUpdates({
            addAdmins: empty,
            removeAdmins: empty,
            addContributors: empty,
            removeContributors: empty,
            addVoters: empty,
            removeVoters: empty
        });
    }
}
