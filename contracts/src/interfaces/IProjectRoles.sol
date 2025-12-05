// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IProjectRoles {
    function isVoter(address account) external view returns (bool);
}
