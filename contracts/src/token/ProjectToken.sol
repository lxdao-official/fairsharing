// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract ProjectToken is ERC20 {
    error ProjectToken__Unauthorized();
    error ProjectToken__ProjectZeroAddress();

    address public immutable project;

    constructor(string memory name_, string memory symbol_, address project_) ERC20(name_, symbol_) {
        if (project_ == address(0)) {
            revert ProjectToken__ProjectZeroAddress();
        }
        project = project_;
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != project) {
            revert ProjectToken__Unauthorized();
        }
        _mint(to, amount);
    }
}
