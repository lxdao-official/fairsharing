// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TestBase} from "../TestBase.sol";
import {Project} from "../../src/project/Project.sol";
import {ProjectToken} from "../../src/token/ProjectToken.sol";
import {ContributionStorage} from "../../src/storage/ContributionStorage.sol";
import {IValidationStrategy} from "../../src/interfaces/IValidationStrategy.sol";
import {IContributionStorage} from "../../src/interfaces/IContributionStorage.sol";

/**
 * @title IntegrationTest
 * @notice Integration tests for complete user flows
 */
contract IntegrationTest is TestBase {
    Project public project;

    function setUp() public override {
        super.setUp();
        address projectProxy = createBasicProject();
        project = Project(projectProxy);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                COMPLETE FLOW TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_integration_fullProjectLifecycle() public {
        // 1. Project is created
        assertEq(project.owner(), projectOwner);
        assertEq(project.projectId(), PROJECT_ID);

        // 2. Add a new voter
        address newVoter = makeAddr("newVoter");
        address[] memory addVoters = new address[](1);
        addVoters[0] = newVoter;

        Project.RoleUpdates memory roleUpdates = emptyRoleUpdates();
        roleUpdates.addVoters = addVoters;

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: project.metadataUri(),
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: roleUpdates
        });

        vm.prank(projectOwner);
        project.updateSettings(settings);

        assertTrue(project.isVoter(newVoter));

        // 3. Submit a contribution
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.prank(voter1);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes,
            "",
            contributor1,
            100,
            '{"title":"First Contribution","description":"Test"}'
        );

        // 4. Verify contribution is recorded
        assertTrue(project.hasProcessedContribution(CONTRIBUTION_ID_1));

        // 5. Verify tokens were minted
        address tokenAddress = project.shareTokensAddress();
        ProjectToken token = ProjectToken(tokenAddress);
        assertEq(token.balanceOf(contributor1), 100 * 1e18);

        // 6. Submit another contribution
        IValidationStrategy.VoteData[] memory votes2 = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_2,
            1
        );

        vm.prank(voter2);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_2,
            CONTRIBUTION_HASH_2,
            votes2,
            "",
            contributor1,
            50,
            '{"title":"Second Contribution","description":"Test"}'
        );

        // 7. Verify total tokens
        assertEq(token.balanceOf(contributor1), 150 * 1e18);
    }

    function test_integration_multipleContributors() public {
        address tokenAddress = project.shareTokensAddress();
        ProjectToken token = ProjectToken(tokenAddress);

        // Contributor 1 submits
        IValidationStrategy.VoteData[] memory votes1 = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.prank(voter1);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes1,
            "",
            contributor1,
            100,
            '{"title":"Contribution 1"}'
        );

        // Contributor 2 submits
        IValidationStrategy.VoteData[] memory votes2 = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_2,
            1
        );

        vm.prank(voter2);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_2,
            CONTRIBUTION_HASH_2,
            votes2,
            "",
            contributor2,
            75,
            '{"title":"Contribution 2"}'
        );

        // Verify balances
        assertEq(token.balanceOf(contributor1), 100 * 1e18);
        assertEq(token.balanceOf(contributor2), 75 * 1e18);
        assertEq(token.totalSupply(), 175 * 1e18);
    }

    function test_integration_contributionStorage() public {
        address storageAddress = project.contributionStorage();
        ContributionStorage storage_ = ContributionStorage(storageAddress);

        // Submit contribution
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.prank(voter1);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );

        // Verify storage
        bytes32 storedHash = storage_.getContributionHash(CONTRIBUTION_ID_1);
        assertEq(storedHash, CONTRIBUTION_HASH_1);
    }

    function test_integration_roleManagementWorkflow() public {
        // Start with basic roles
        assertTrue(project.isVoter(voter1));
        assertFalse(project.isAdmin(voter1));
        assertFalse(project.isContributor(voter1));

        // Promote voter1 to admin and contributor
        address[] memory addAdmins = new address[](1);
        addAdmins[0] = voter1;

        address[] memory addContributors = new address[](1);
        addContributors[0] = voter1;

        Project.RoleUpdates memory roleUpdates = emptyRoleUpdates();
        roleUpdates.addAdmins = addAdmins;
        roleUpdates.addContributors = addContributors;

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: project.metadataUri(),
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: roleUpdates
        });

        vm.prank(projectOwner);
        project.updateSettings(settings);

        // Verify all roles
        assertRoles(project, voter1, true, true, true);

        // Remove admin role
        address[] memory removeAdmins = new address[](1);
        removeAdmins[0] = voter1;

        Project.RoleUpdates memory roleUpdates2 = emptyRoleUpdates();
        roleUpdates2.removeAdmins = removeAdmins;

        Project.UpdateSettings memory settings2 = Project.UpdateSettings({
            metadataUri: project.metadataUri(),
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: roleUpdates2
        });

        vm.prank(projectOwner);
        project.updateSettings(settings2);

        // Verify role removal
        assertFalse(project.isAdmin(voter1));
        assertTrue(project.isContributor(voter1));
        assertTrue(project.isVoter(voter1));
    }

    function test_integration_metadataEvolution() public {
        string memory metadata1 = "ipfs://test-metadata";
        assertEq(project.metadataUri(), metadata1);

        // Update metadata
        string memory metadata2 = "ipfs://updated-metadata-v2";
        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: metadata2,
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: emptyRoleUpdates()
        });

        vm.prank(projectOwner);
        project.updateSettings(settings);

        assertEq(project.metadataUri(), metadata2);

        // Update again
        string memory metadata3 = "ipfs://final-metadata-v3";
        Project.UpdateSettings memory settings2 = Project.UpdateSettings({
            metadataUri: metadata3,
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: emptyRoleUpdates()
        });

        vm.prank(projectOwner);
        project.updateSettings(settings2);

        assertEq(project.metadataUri(), metadata3);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                ERROR RECOVERY TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_integration_cannotSubmitDuplicateContribution() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        // First submission succeeds
        vm.prank(voter1);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );

        // Second submission should fail (handled by ContributionStorage)
        vm.prank(voter2);
        vm.expectRevert();
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );
    }

    /*//////////////////////////////////////////////////////////////////////////
                                TOKEN ECONOMICS TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_integration_tokenDistribution() public {
        address tokenAddress = project.shareTokensAddress();
        ProjectToken token = ProjectToken(tokenAddress);

        // Initial supply is 0
        assertEq(token.totalSupply(), 0);

        // Multiple contributions with different rewards
        uint256[] memory rewards = new uint256[](5);
        rewards[0] = 100;
        rewards[1] = 50;
        rewards[2] = 75;
        rewards[3] = 125;
        rewards[4] = 200;

        address[] memory contributors = new address[](5);
        contributors[0] = contributor1;
        contributors[1] = contributor2;
        contributors[2] = contributor1;
        contributors[3] = contributor2;
        contributors[4] = contributor1;

        for (uint256 i = 0; i < 5; i++) {
            bytes32 contribId = keccak256(abi.encodePacked("contribution", i));
            bytes32 contribHash = keccak256(abi.encodePacked("hash", i));

            IValidationStrategy.VoteData[] memory votes = createVotes(
                address(project),
                PROJECT_ID,
                contribId,
                1
            );

            vm.prank(voter1);
            project.submitContribution(
                PROJECT_ID,
                contribId,
                contribHash,
                votes,
                "",
                contributors[i],
                rewards[i],
                '{"title":"Test"}'
            );
        }

        // Contributor1: 100 + 75 + 200 = 375
        // Contributor2: 50 + 125 = 175
        assertEq(token.balanceOf(contributor1), 375 * 1e18);
        assertEq(token.balanceOf(contributor2), 175 * 1e18);
        assertEq(token.totalSupply(), 550 * 1e18);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                PERMISSION BOUNDARY TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_integration_onlyVotersCanSubmit() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        // Non-voter cannot submit
        address nonVoter = makeAddr("nonVoter");
        vm.prank(nonVoter);
        vm.expectRevert(Project.Project__CallerNotVoter.selector);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );

        // Voter can submit
        vm.prank(voter1);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );
    }

    function test_integration_onlyOwnerCanUpdateSettings() public {
        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: "ipfs://new",
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: emptyRoleUpdates()
        });

        // Non-owner cannot update
        vm.prank(voter1);
        vm.expectRevert();
        project.updateSettings(settings);

        // Owner can update
        vm.prank(projectOwner);
        project.updateSettings(settings);

        assertEq(project.metadataUri(), "ipfs://new");
    }
}
