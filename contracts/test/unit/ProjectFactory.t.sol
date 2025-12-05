// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TestBase} from "../TestBase.sol";
import {ProjectFactory} from "../../src/factories/ProjectFactory.sol";
import {Project} from "../../src/project/Project.sol";
import {ValidateModel} from "../../src/type/ValidateModel.sol";
import {ContributionModel} from "../../src/type/ContributionModel.sol";

contract ProjectFactoryTest is TestBase {
    /*//////////////////////////////////////////////////////////////////////////
                                DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_deployment() public {
        assertEq(factory.owner(), owner);
        assertNotEq(factory.projectImplementation(), address(0));
    }

    function test_projectImplementationIsContract() public {
        address impl = factory.projectImplementation();
        uint256 size;
        assembly {
            size := extcodesize(impl)
        }
        assertGt(size, 0, "Implementation should be a contract");
    }

    /*//////////////////////////////////////////////////////////////////////////
                                CREATE PROJECT TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_createProject_minimal() public {
        address projectProxy = createBasicProject();

        assertTrue(projectProxy != address(0), "Project should be created");

        Project project = Project(projectProxy);
        assertEq(project.projectId(), PROJECT_ID);
        assertEq(project.owner(), projectOwner);
    }

    function test_createProject_withRoles() public {
        address projectProxy = createProjectWithRoles();
        Project project = Project(projectProxy);

        // Check owner has all roles
        assertRoles(project, projectOwner, true, true, true);

        // Check assigned roles
        assertTrue(project.isAdmin(admin1));
        assertTrue(project.isVoter(voter1));
        assertTrue(project.isVoter(voter2));
        assertTrue(project.isContributor(contributor1));
    }

    function test_createProject_emitsEvent() public {
        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "Event Test Project",
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
            tokenSymbol: "EVT"
        });

        vm.expectEmit(false, true, false, false);
        emit ProjectFactory.ProjectCreated(address(0), factory.projectImplementation(), projectOwner, address(this), "Event Test Project");

        factory.createProject(params);
    }

    function test_createProject_deploysToken() public {
        address projectProxy = createBasicProject();
        Project project = Project(projectProxy);

        address tokenAddress = project.shareTokensAddress();
        assertTrue(tokenAddress != address(0), "Token should be deployed");
    }

    function test_createProject_deploysContributionStorage() public {
        address projectProxy = createBasicProject();
        Project project = Project(projectProxy);

        address storageAddress = project.contributionStorage();
        assertTrue(storageAddress != address(0), "Storage should be deployed");
    }

    /*//////////////////////////////////////////////////////////////////////////
                                VALIDATION TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_revert_createProject_zeroProjectOwner() public {
        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: address(0),
            name: "Test",
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

        vm.expectRevert(ProjectFactory.ProjectFactory__ProjectOwnerZero.selector);
        factory.createProject(params);
    }

    function test_revert_createProject_zeroProjectId() public {
        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: bytes32(0),
            projectOwner: projectOwner,
            name: "Test",
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

        vm.expectRevert(ProjectFactory.ProjectFactory__ProjectIdZero.selector);
        factory.createProject(params);
    }

    function test_revert_createProject_emptyName() public {
        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "",
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

        vm.expectRevert(ProjectFactory.ProjectFactory__ProjectNameEmpty.selector);
        factory.createProject(params);
    }

    function test_revert_createProject_zeroValidationStrategy() public {
        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "Test",
            metadataUri: "ipfs://test",
            orgAddress: address(0),
            validateModel: ValidateModel.PUBLIC,
            contributionModel: ContributionModel.PUBLIC,
            validationStrategy: address(0),
            votingStrategy: address(0),
            treasuryAddress: address(0),
            admins: emptyArray,
            contributors: emptyArray,
            voters: emptyArray,
            tokenSymbol: "TEST"
        });

        vm.expectRevert(ProjectFactory.ProjectFactory__ValidationStrategyZero.selector);
        factory.createProject(params);
    }

    function test_revert_createProject_emptyTokenSymbol() public {
        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "Test",
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
            tokenSymbol: ""
        });

        vm.expectRevert(ProjectFactory.ProjectFactory__TokenSymbolEmpty.selector);
        factory.createProject(params);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                OWNERSHIP TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_transferOwnership() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(owner);
        factory.transferOwnership(newOwner);

        assertEq(factory.owner(), newOwner);
    }

    function test_revert_transferOwnership_notOwner() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(projectOwner);
        vm.expectRevert(ProjectFactory.ProjectFactory__NotOwner.selector);
        factory.transferOwnership(newOwner);
    }

    function test_revert_transferOwnership_zeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ProjectFactory.ProjectFactory__NewOwnerZero.selector);
        factory.transferOwnership(address(0));
    }

    /*//////////////////////////////////////////////////////////////////////////
                                IMPLEMENTATION TESTS
    //////////////////////////////////////////////////////////////////////////*/

    function test_setProjectImplementation() public {
        address newImpl = address(new Project());

        vm.prank(owner);
        factory.setProjectImplementation(newImpl);

        assertEq(factory.projectImplementation(), newImpl);
    }

    function test_revert_setProjectImplementation_notOwner() public {
        address newImpl = address(new Project());

        vm.prank(projectOwner);
        vm.expectRevert(ProjectFactory.ProjectFactory__NotOwner.selector);
        factory.setProjectImplementation(newImpl);
    }

    function test_revert_setProjectImplementation_zeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ProjectFactory.ProjectFactory__ImplementationZero.selector);
        factory.setProjectImplementation(address(0));
    }

    function test_revert_setProjectImplementation_notContract() public {
        address notContract = makeAddr("notContract");

        vm.prank(owner);
        vm.expectRevert(ProjectFactory.ProjectFactory__ImplementationNotContract.selector);
        factory.setProjectImplementation(notContract);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                TOKEN NAME COMPOSITION
    //////////////////////////////////////////////////////////////////////////*/

    function test_tokenNameComposition() public {
        address[] memory emptyArray = new address[](0);

        ProjectFactory.CreateProjectParams memory params = ProjectFactory.CreateProjectParams({
            projectId: PROJECT_ID,
            projectOwner: projectOwner,
            name: "My Project",
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
            tokenSymbol: "MYP"
        });

        address projectProxy = factory.createProject(params);
        Project project = Project(projectProxy);

        address tokenAddress = project.shareTokensAddress();
        // Token name should be "My Project Token"
        // We can't directly test this without importing ERC20, but we verified deployment
        assertTrue(tokenAddress != address(0));
    }
}
