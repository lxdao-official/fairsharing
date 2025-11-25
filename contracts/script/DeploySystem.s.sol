// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import {ProjectFactory} from "../src/factories/ProjectFactory.sol";
import {SimpleMajorityValidationStrategy} from "../src/validation/SimpleMajorityValidationStrategy.sol";

contract DeploySystem is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        uint256 chainId = block.chainid;

        console2.log("Deploying contracts to chain", chainId);
        console2.log("Deployer address:", deployer);

        vm.startBroadcast(deployerKey);

        SimpleMajorityValidationStrategy validationStrategy = new SimpleMajorityValidationStrategy();
        ProjectFactory factory = new ProjectFactory();
        address projectImplementation = factory.projectImplementation();

        vm.stopBroadcast();

        console2.log("SimpleMajorityValidationStrategy deployed at:", address(validationStrategy));
        console2.log("ProjectFactory deployed at:", address(factory));
        console2.log("Project implementation at:", projectImplementation);

        _logDeploymentSummary(
            chainId,
            deployer,
            address(validationStrategy),
            address(factory),
            projectImplementation
        );
    }

    function _logDeploymentSummary(
        uint256 chainId,
        address deployer,
        address validationStrategy,
        address factory,
        address projectImplementation
    ) private {
        string memory summary = "deployment";
        summary = vm.serializeUint(summary, "chainId", chainId);
        summary = vm.serializeAddress(summary, "deployer", deployer);
        summary = vm.serializeAddress(summary, "SimpleMajorityValidationStrategy", validationStrategy);
        summary = vm.serializeAddress(summary, "ProjectFactory", factory);
        summary = vm.serializeAddress(summary, "ProjectImplementation", projectImplementation);

        console2.log("Deployment summary JSON:");
        console2.log(summary);
    }
}
