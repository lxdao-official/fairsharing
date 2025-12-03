// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TestBase} from "../TestBase.sol";
import {Project} from "../../src/project/Project.sol";
import {ProjectToken} from "../../src/token/ProjectToken.sol";
import {ValidateModel} from "../../src/type/ValidateModel.sol";
import {ContributionModel} from "../../src/type/ContributionModel.sol";
import {IValidationStrategy} from "../../src/interfaces/IValidationStrategy.sol";

contract ProjectTest is TestBase {
    Project public project;

    function setUp() public override {
        super.setUp();
        address projectProxy = createBasicProject();
        project = Project(projectProxy);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_initialization() public {
        assertEq(project.projectId(), PROJECT_ID);
        assertEq(project.owner(), projectOwner);
        assertNotEq(project.id(), 0);
        assertGt(project.initializedAt(), 0);
    }

    function test_initialization_ownerHasAllRoles() public {
        assertRoles(project, projectOwner, true, true, true);
    }

    function test_initialization_votersAssigned() public {
        assertTrue(project.isVoter(voter1));
        assertTrue(project.isVoter(voter2));
        assertTrue(project.isVoter(voter3));
    }

    function test_metadataUri() public {
        assertEq(project.metadataUri(), "ipfs://test-metadata");
    }

    function test_validationStrategy() public {
        assertEq(project.validationStrategy(), address(validationStrategy));
    }

    function test_shareTokensAddress() public {
        address tokenAddress = project.shareTokensAddress();
        assertTrue(tokenAddress != address(0));
    }

    /*//////////////////////////////////////////////////////////////////////////
                                ROLE MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_updateSettings_addVoters() public {
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
    }

    function test_updateSettings_removeVoter() public {
        address[] memory removeVoters = new address[](1);
        removeVoters[0] = voter1;

        Project.RoleUpdates memory roleUpdates = emptyRoleUpdates();
        roleUpdates.removeVoters = removeVoters;

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: project.metadataUri(),
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: roleUpdates
        });

        vm.prank(projectOwner);
        project.updateSettings(settings);

        assertFalse(project.isVoter(voter1));
    }

    function test_updateSettings_cannotRemoveOwnerRoles() public {
        address[] memory removeVoters = new address[](1);
        removeVoters[0] = projectOwner;

        Project.RoleUpdates memory roleUpdates = emptyRoleUpdates();
        roleUpdates.removeVoters = removeVoters;

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: project.metadataUri(),
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: roleUpdates
        });

        vm.prank(projectOwner);
        project.updateSettings(settings);

        // Owner should still have all roles
        assertRoles(project, projectOwner, true, true, true);
    }

    function test_updateSettings_multipleRoles() public {
        address newAdmin = makeAddr("newAdmin");
        address newContributor = makeAddr("newContributor");
        address newVoter = makeAddr("newVoter");

        address[] memory addAdmins = new address[](1);
        addAdmins[0] = newAdmin;

        address[] memory addContributors = new address[](1);
        addContributors[0] = newContributor;

        address[] memory addVoters = new address[](1);
        addVoters[0] = newVoter;

        address[] memory emptyArray = new address[](0);

        Project.RoleUpdates memory roleUpdates = Project.RoleUpdates({
            addAdmins: addAdmins,
            removeAdmins: emptyArray,
            addContributors: addContributors,
            removeContributors: emptyArray,
            addVoters: addVoters,
            removeVoters: emptyArray
        });

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: project.metadataUri(),
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: roleUpdates
        });

        vm.prank(projectOwner);
        project.updateSettings(settings);

        assertTrue(project.isAdmin(newAdmin));
        assertTrue(project.isContributor(newContributor));
        assertTrue(project.isVoter(newVoter));
    }

    function test_updateSettings_emitsEvent() public {
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

        vm.expectEmit(true, false, false, true);
        emit Project.RoleUpdated(newVoter, false, false, true);

        vm.prank(projectOwner);
        project.updateSettings(settings);
    }

    function test_revert_updateSettings_notOwner() public {
        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: "ipfs://new-metadata",
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: emptyRoleUpdates()
        });

        vm.prank(voter1);
        vm.expectRevert();
        project.updateSettings(settings);
    }

    function test_revert_updateSettings_zeroAddressRole() public {
        address[] memory addVoters = new address[](1);
        addVoters[0] = address(0);

        Project.RoleUpdates memory roleUpdates = emptyRoleUpdates();
        roleUpdates.addVoters = addVoters;

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: project.metadataUri(),
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: roleUpdates
        });

        vm.prank(projectOwner);
        vm.expectRevert(Project.Project__ZeroAddressRoleUpdate.selector);
        project.updateSettings(settings);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                METADATA UPDATE TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_updateSettings_changeMetadata() public {
        string memory newMetadata = "ipfs://new-metadata-uri";

        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: newMetadata,
            validateModel: project.validateModel(),
            contributionModel: project.contributionModel(),
            roles: emptyRoleUpdates()
        });

        vm.prank(projectOwner);
        project.updateSettings(settings);

        assertEq(project.metadataUri(), newMetadata);
    }

    function test_updateSettings_changeValidateModel() public {
        Project.UpdateSettings memory settings = Project.UpdateSettings({
            metadataUri: project.metadataUri(),
            validateModel: ValidateModel.VALIDATOR,
            contributionModel: project.contributionModel(),
            roles: emptyRoleUpdates()
        });

        vm.prank(projectOwner);
        project.updateSettings(settings);

        assertEq(uint8(project.validateModel()), uint8(ValidateModel.VALIDATOR));
    }

    /*//////////////////////////////////////////////////////////////////////////
                                CONTRIBUTION SUBMISSION TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_submitContribution_success() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1 // PASS
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

        assertTrue(project.hasProcessedContribution(CONTRIBUTION_ID_1));
    }

    function test_submitContribution_mintsTokens() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        address tokenAddress = project.shareTokensAddress();
        ProjectToken token = ProjectToken(tokenAddress);

        uint256 balanceBefore = token.balanceOf(contributor1);

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

        uint256 balanceAfter = token.balanceOf(contributor1);
        assertEq(balanceAfter - balanceBefore, 100 * 1e18);
    }

    function test_submitContribution_zeroReward() public {
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
            0, // zero reward
            '{"title":"Test"}'
        );

        assertTrue(project.hasProcessedContribution(CONTRIBUTION_ID_1));
    }

    function test_submitContribution_emitsEvent() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.expectEmit(true, true, false, true);
        emit Project.ContributionSubmitted(PROJECT_ID, CONTRIBUTION_ID_1, CONTRIBUTION_HASH_1, voter1);

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

    /*//////////////////////////////////////////////////////////////////////////
                                CONTRIBUTION VALIDATION TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_revert_submitContribution_zeroContributionId() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.prank(voter1);
        vm.expectRevert(Project.Project__ContributionIdZero.selector);
        project.submitContribution(
            PROJECT_ID,
            bytes32(0),
            CONTRIBUTION_HASH_1,
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );
    }

    function test_revert_submitContribution_zeroContributionHash() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.prank(voter1);
        vm.expectRevert(Project.Project__ContributionHashZero.selector);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            bytes32(0),
            votes,
            "",
            contributor1,
            100,
            '{"title":"Test"}'
        );
    }

    function test_revert_submitContribution_zeroRewardRecipient() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.prank(voter1);
        vm.expectRevert(Project.Project__RewardRecipientZero.selector);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes,
            "",
            address(0),
            100,
            '{"title":"Test"}'
        );
    }

    function test_revert_submitContribution_emptyPayload() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.prank(voter1);
        vm.expectRevert(Project.Project__EmptyContributionPayload.selector);
        project.submitContribution(
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            CONTRIBUTION_HASH_1,
            votes,
            "",
            contributor1,
            100,
            ""
        );
    }

    function test_revert_submitContribution_notVoter() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

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
    }

    function test_revert_submitContribution_projectIdMismatch() public {
        IValidationStrategy.VoteData[] memory votes = createVotes(
            address(project),
            PROJECT_ID,
            CONTRIBUTION_ID_1,
            1
        );

        vm.prank(voter1);
        vm.expectRevert(Project.Project__ProjectIdMismatch.selector);
        project.submitContribution(
            keccak256("wrong-project-id"),
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
                                VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_hasProcessedContribution_false() public {
        assertFalse(project.hasProcessedContribution(CONTRIBUTION_ID_1));
    }

    function test_hasProcessedContribution_true() public {
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

        assertTrue(project.hasProcessedContribution(CONTRIBUTION_ID_1));
    }

    function test_getters() public {
        assertEq(project.projectId(), PROJECT_ID);
        assertEq(project.owner(), projectOwner);
        assertEq(project.metadataUri(), "ipfs://test-metadata");
        assertEq(project.validationStrategy(), address(validationStrategy));
        assertEq(project.treasuryAddress(), treasury);
        assertEq(uint8(project.validateModel()), uint8(ValidateModel.PUBLIC));
        assertEq(uint8(project.contributionModel()), uint8(ContributionModel.PUBLIC));
    }
}
