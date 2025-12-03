// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";
import {ProjectFactory} from "../../src/factories/ProjectFactory.sol";
import {Project} from "../../src/project/Project.sol";
import {SimpleMajorityValidationStrategy} from "../../src/validation/SimpleMajorityValidationStrategy.sol";
import {ValidateModel} from "../../src/type/ValidateModel.sol";
import {ContributionModel} from "../../src/type/ContributionModel.sol";
import {IValidationStrategy} from "../../src/interfaces/IValidationStrategy.sol";

contract GasBenchmarkTest is Test {
    ProjectFactory public factory;
    SimpleMajorityValidationStrategy public validationStrategy;

    address public owner = address(0x1);
    address public projectOwner = address(0x2);
    address public voter1 = address(0x3);
    address public voter2 = address(0x4);
    address public voter3 = address(0x5);
    address public contributor1 = address(0x6);

    uint256 public voter1PrivateKey = 0x1111;
    uint256 public voter2PrivateKey = 0x2222;
    uint256 public voter3PrivateKey = 0x3333;

    bytes32 public constant PROJECT_ID = bytes32(uint256(1));
    bytes32 public constant CONTRIBUTION_ID = bytes32(uint256(100));
    bytes32 public constant CONTRIBUTION_HASH = keccak256("test contribution");

    function setUp() public {
        vm.startPrank(owner);
        factory = new ProjectFactory();
        validationStrategy = new SimpleMajorityValidationStrategy();
        vm.stopPrank();

        // Setup voter addresses from private keys
        voter1 = vm.addr(voter1PrivateKey);
        voter2 = vm.addr(voter2PrivateKey);
        voter3 = vm.addr(voter3PrivateKey);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                GAS BENCHMARK: CREATE PROJECT
    //////////////////////////////////////////////////////////////////////////*/

    function test_gas_createProject_minimal() public {
        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "Test Project",
            metadataUri: "ipfs://test",
            orgAddress: address(0),
            validateModel: ValidateModel.PUBLIC,
            contributionModel: ContributionModel.PUBLIC,
            validationStrategy: address(validationStrategy),
            votingStrategy: address(0),
            treasuryAddress: address(0),
            admins: emptyArray,
            contributors: emptyArray,
            voters: emptyArray,
            tokenSymbol: "TEST"
        });

        uint256 gasBefore = gasleft();
        address projectProxy = factory.createProject(params);
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("=== CREATE PROJECT (Minimal) ===");
        console2.log("Gas used:", gasUsed);
        console2.log("Project address:", projectProxy);

        assertTrue(projectProxy != address(0));
    }

    function test_gas_createProject_withRoles() public {
        address[] memory admins = new address[](2);
        admins[0] = voter1;
        admins[1] = voter2;

        address[] memory contributors = new address[](3);
        contributors[0] = voter1;
        contributors[1] = voter2;
        contributors[2] = contributor1;

        address[] memory voters = new address[](3);
        voters[0] = voter1;
        voters[1] = voter2;
        voters[2] = voter3;

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "Test Project with Roles",
            metadataUri: "ipfs://test-roles",
            orgAddress: address(0xABC),
            validateModel: ValidateModel.VALIDATOR,
            contributionModel: ContributionModel.RESTRICTED,
            validationStrategy: address(validationStrategy),
            votingStrategy: address(0),
            treasuryAddress: address(0xDEF),
            admins: admins,
            contributors: contributors,
            voters: voters,
            tokenSymbol: "TROLES"
        });

        uint256 gasBefore = gasleft();
        address projectProxy = factory.createProject(params);
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("\n=== CREATE PROJECT (With Roles) ===");
        console2.log("Gas used:", gasUsed);
        console2.log("Admins:", admins.length);
        console2.log("Contributors:", contributors.length);
        console2.log("Voters:", voters.length);

        assertTrue(projectProxy != address(0));
    }

    /*//////////////////////////////////////////////////////////////////////////
                                GAS BENCHMARK: SUBMIT CONTRIBUTION
    //////////////////////////////////////////////////////////////////////////*/

    function test_gas_submitContribution_singleVote() public {
        // Create project first
        address projectProxy = _createTestProject();
        Project project = Project(projectProxy);

        // Create signed vote
        IValidationStrategy.VoteData[] memory votes = new IValidationStrategy.VoteData[](1);
        votes[0] = _createVote(projectProxy, CONTRIBUTION_ID, voter1PrivateKey, voter1, 1, 1); // PASS vote

        // Submit contribution
        vm.startPrank(voter1);
        uint256 gasBefore = gasleft();
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID,
            CONTRIBUTION_HASH,
            votes,
            "",
            contributor1,
            100, // reward amount
            '{"title":"Test Contribution","description":"Test"}'
        );
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console2.log("\n=== SUBMIT CONTRIBUTION (1 Vote) ===");
        console2.log("Gas used:", gasUsed);
        console2.log("Breakdown:");
        console2.log("  - Parameter validation: ~500 gas");
        console2.log("  - Vote verification: ~variable");
        console2.log("  - Storage updates: ~variable");
        console2.log("  - Token minting: ~variable");

        assertTrue(project.hasProcessedContribution(CONTRIBUTION_ID));
    }

    function test_gas_submitContribution_threeVotes() public {
        address projectProxy = _createTestProject();
        Project project = Project(projectProxy);

        // Create 3 signed votes
        IValidationStrategy.VoteData[] memory votes = new IValidationStrategy.VoteData[](3);
        votes[0] = _createVote(projectProxy, CONTRIBUTION_ID, voter1PrivateKey, voter1, 1, 1); // PASS
        votes[1] = _createVote(projectProxy, CONTRIBUTION_ID, voter2PrivateKey, voter2, 1, 2); // PASS
        votes[2] = _createVote(projectProxy, CONTRIBUTION_ID, voter3PrivateKey, voter3, 1, 3); // PASS

        vm.startPrank(voter1);
        uint256 gasBefore = gasleft();
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID,
            CONTRIBUTION_HASH,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test Contribution","description":"Test"}'
        );
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console2.log("\n=== SUBMIT CONTRIBUTION (3 Votes) ===");
        console2.log("Gas used:", gasUsed);
        console2.log("Average per vote:", gasUsed / 3);

        assertTrue(project.hasProcessedContribution(CONTRIBUTION_ID));
    }

    function test_gas_submitContribution_fiveVotes() public {
        address projectProxy = _createTestProject();
        Project project = Project(projectProxy);

        // Create 5 signed votes
        IValidationStrategy.VoteData[] memory votes = new IValidationStrategy.VoteData[](5);
        votes[0] = _createVote(projectProxy, CONTRIBUTION_ID, voter1PrivateKey, voter1, 1, 1);
        votes[1] = _createVote(projectProxy, CONTRIBUTION_ID, voter2PrivateKey, voter2, 1, 2);
        votes[2] = _createVote(projectProxy, CONTRIBUTION_ID, voter3PrivateKey, voter3, 1, 3);
        votes[3] = _createVote(projectProxy, CONTRIBUTION_ID, voter1PrivateKey, voter1, 1, 4);
        votes[4] = _createVote(projectProxy, CONTRIBUTION_ID, voter2PrivateKey, voter2, 1, 5);

        vm.startPrank(voter1);
        uint256 gasBefore = gasleft();
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID,
            CONTRIBUTION_HASH,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test Contribution","description":"Test"}'
        );
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console2.log("\n=== SUBMIT CONTRIBUTION (5 Votes) ===");
        console2.log("Gas used:", gasUsed);
        console2.log("Average per vote:", gasUsed / 5);

        assertTrue(project.hasProcessedContribution(CONTRIBUTION_ID));
    }

    /*//////////////////////////////////////////////////////////////////////////
                                GAS BENCHMARK: VALIDATION FAILURES
    //////////////////////////////////////////////////////////////////////////*/

    function test_gas_submitContribution_failEarly_invalidContributionId() public {
        address projectProxy = _createTestProject();
        Project project = Project(projectProxy);

        IValidationStrategy.VoteData[] memory votes = new IValidationStrategy.VoteData[](1);
        votes[0] = _createVote(projectProxy, CONTRIBUTION_ID, voter1PrivateKey, voter1, 1, 1);

        vm.startPrank(voter1);
        uint256 gasBefore = gasleft();

        vm.expectRevert(Project.Project__ContributionIdZero.selector);
        project.submitContribution(
            PROJECT_ID,
            bytes32(0), // Invalid - should fail early
            CONTRIBUTION_HASH,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );

        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console2.log("\n=== EARLY VALIDATION FAILURE (contributionId) ===");
        console2.log("Gas used:", gasUsed);
        console2.log("Optimized: Check fails before SLOAD");
    }

    function test_gas_submitContribution_failLate_notVoter() public {
        address projectProxy = _createTestProject();
        Project project = Project(projectProxy);

        IValidationStrategy.VoteData[] memory votes = new IValidationStrategy.VoteData[](1);
        votes[0] = _createVote(projectProxy, CONTRIBUTION_ID, voter1PrivateKey, voter1, 1, 1);

        address nonVoter = address(0x999);
        vm.startPrank(nonVoter);
        uint256 gasBefore = gasleft();

        vm.expectRevert(Project.Project__CallerNotVoter.selector);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID,
            CONTRIBUTION_HASH,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );

        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console2.log("\n=== LATE VALIDATION FAILURE (not voter) ===");
        console2.log("Gas used:", gasUsed);
        console2.log("Note: SLOAD performed before this check");
    }

    /*//////////////////////////////////////////////////////////////////////////
                                GAS BENCHMARK: UPDATE SETTINGS
    //////////////////////////////////////////////////////////////////////////*/

    function test_gas_updateSettings_noRoleChanges() public {
        address projectProxy = _createTestProject();
        Project project = Project(projectProxy);

        address[] memory emptyArray = new address[](0);
        Project.RoleUpdates memory roleUpdates = Project.RoleUpdates({
            addAdmins: emptyArray,
            removeAdmins: emptyArray,
            addContributors: emptyArray,
            removeContributors: emptyArray,
            addVoters: emptyArray,
            removeVoters: emptyArray
        });

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: "ipfs://updated",
            validateModel: ValidateModel.VALIDATOR,
            contributionModel: ContributionModel.RESTRICTED,
            roles: roleUpdates
        });

        vm.startPrank(projectOwner);
        uint256 gasBefore = gasleft();
        project.updateSettings(settings);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console2.log("\n=== UPDATE SETTINGS (No Role Changes) ===");
        console2.log("Gas used:", gasUsed);
    }

    function test_gas_updateSettings_addRoles() public {
        address projectProxy = _createTestProject();
        Project project = Project(projectProxy);

        address[] memory newVoters = new address[](3);
        newVoters[0] = address(0x10);
        newVoters[1] = address(0x11);
        newVoters[2] = address(0x12);

        address[] memory emptyArray = new address[](0);
        Project.RoleUpdates memory roleUpdates = Project.RoleUpdates({
            addAdmins: emptyArray,
            removeAdmins: emptyArray,
            addContributors: emptyArray,
            removeContributors: emptyArray,
            addVoters: newVoters,
            removeVoters: emptyArray
        });

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: "ipfs://updated",
            validateModel: ValidateModel.VALIDATOR,
            contributionModel: ContributionModel.RESTRICTED,
            roles: roleUpdates
        });

        vm.startPrank(projectOwner);
        uint256 gasBefore = gasleft();
        project.updateSettings(settings);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console2.log("\n=== UPDATE SETTINGS (Add 3 Voters) ===");
        console2.log("Gas used:", gasUsed);
        console2.log("Gas per role:", gasUsed / 3);
        console2.log("Optimized with unchecked loop increments");
    }

    /*//////////////////////////////////////////////////////////////////////////
                                HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function _createTestProject() internal returns (address) {
        address[] memory voters = new address[](3);
        voters[0] = voter1;
        voters[1] = voter2;
        voters[2] = voter3;

        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "Test Project",
            metadataUri: "ipfs://test",
            orgAddress: address(0),
            validateModel: ValidateModel.PUBLIC,
            contributionModel: ContributionModel.RESTRICTED,
            validationStrategy: address(validationStrategy),
            votingStrategy: address(0),
            treasuryAddress: address(0),
            admins: emptyArray,
            contributors: emptyArray,
            voters: voters,
            tokenSymbol: "TEST"
        });

        return factory.createProject(params);
    }

    function _createVote(
        address projectAddress,
        bytes32 contributionId,
        uint256 privateKey,
        address voter,
        uint8 choice,
        uint256 nonce
    ) internal view returns (IValidationStrategy.VoteData memory) {
        bytes32 digest = _getVoteDigest(projectAddress, contributionId, voter, choice, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        return IValidationStrategy.VoteData({
            voter: voter,
            choice: choice,
            nonce: nonce,
            signature: signature
        });
    }

    function _getVoteDigest(
        address projectAddress,
        bytes32 contributionId,
        address voter,
        uint8 choice,
        uint256 nonce
    ) internal view returns (bytes32) {
        bytes32 DOMAIN_TYPEHASH = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        bytes32 VOTE_TYPEHASH = keccak256(
            "Vote(bytes32 projectId,bytes32 contributionId,address voter,uint8 choice,uint256 nonce)"
        );

        bytes32 domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("Fairsharing Vote")),
                keccak256(bytes("1")),
                block.chainid,
                projectAddress
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(VOTE_TYPEHASH, PROJECT_ID, contributionId, voter, choice, nonce)
        );

        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}
