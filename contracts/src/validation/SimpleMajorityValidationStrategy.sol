// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

import {IValidationStrategy} from "../interfaces/IValidationStrategy.sol";
import {IProjectRoles} from "../interfaces/IProjectRoles.sol";
import {ValidateModel} from "../type/ValidateModel.sol";

contract SimpleMajorityValidationStrategy is IValidationStrategy {
    using ECDSA for bytes32;

    string public constant DOMAIN_NAME = "Fairsharing Vote";
    string public constant DOMAIN_VERSION = "1";

    uint8 private constant CHOICE_FAIL = 0;
    uint8 private constant CHOICE_PASS = 1;
    uint8 private constant CHOICE_SKIP = 2;

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant VOTE_TYPEHASH =
        keccak256("Vote(bytes32 projectId,bytes32 contributionId,address voter,uint8 choice,uint256 nonce)");

    // Pre-computed hashes for gas optimization
    bytes32 private immutable DOMAIN_NAME_HASH;
    bytes32 private immutable DOMAIN_VERSION_HASH;

    mapping(bytes32 => bool) private _consumedVotes;

    error SimpleMajorityValidationStrategy__InvalidContext();
    error SimpleMajorityValidationStrategy__InvalidVote();
    error SimpleMajorityValidationStrategy__NonceAlreadyUsed();
    error SimpleMajorityValidationStrategy__NotAuthorizedVoter();
    error SimpleMajorityValidationStrategy__InsufficientSupport();

    constructor() {
        DOMAIN_NAME_HASH = keccak256(bytes(DOMAIN_NAME));
        DOMAIN_VERSION_HASH = keccak256(bytes(DOMAIN_VERSION));
    }

    function verify(
        VerifyContext calldata context,
        VoteData[] calldata votes,
        bytes calldata /* extraData */
    ) external override {
        if (context.project == address(0) || context.projectId == bytes32(0) || context.contributionId == bytes32(0)) {
            revert SimpleMajorityValidationStrategy__InvalidContext();
        }

        uint256 votesLength = votes.length;
        if (votesLength == 0) {
            revert SimpleMajorityValidationStrategy__InsufficientSupport();
        }

        bytes32 domainSeparator = _domainSeparator(context.project);
        uint256 supportCount;
        uint256 totalCount;

        for (uint256 i = 0; i < votesLength;) {
            VoteData calldata vote = votes[i];
            if (vote.voter == address(0) || vote.signature.length == 0 || vote.nonce == 0) {
                revert SimpleMajorityValidationStrategy__InvalidVote();
            }

            bytes32 digest = _voteDigest(domainSeparator, context, vote);
            address signer = digest.recover(vote.signature);
            if (signer != vote.voter) {
                revert SimpleMajorityValidationStrategy__InvalidVote();
            }

            if (context.validateModel == ValidateModel.VALIDATOR) {
                if (!IProjectRoles(context.project).isVoter(signer)) {
                    revert SimpleMajorityValidationStrategy__NotAuthorizedVoter();
                }
            }

            bytes32 voteKey = _voteKey(context.project, context.contributionId, signer, vote.nonce);
            if (_consumedVotes[voteKey]) {
                revert SimpleMajorityValidationStrategy__NonceAlreadyUsed();
            }
            _consumedVotes[voteKey] = true;

            if (vote.choice == CHOICE_PASS) {
                unchecked {
                    ++supportCount;
                    ++totalCount;
                }
            } else if (vote.choice == CHOICE_FAIL) {
                unchecked {
                    ++totalCount;
                }
            } else if (vote.choice != CHOICE_SKIP) {
                revert SimpleMajorityValidationStrategy__InvalidVote();
            }

            unchecked {
                ++i;
            }
        }

        if (totalCount == 0 || supportCount * 2 <= totalCount) {
            revert SimpleMajorityValidationStrategy__InsufficientSupport();
        }
    }

    function _domainSeparator(address project) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                DOMAIN_NAME_HASH,
                DOMAIN_VERSION_HASH,
                block.chainid,
                project
            )
        );
    }

    function _voteDigest(bytes32 domainSeparator, VerifyContext calldata context, VoteData calldata vote)
        private
        pure
        returns (bytes32)
    {
        bytes32 structHash = keccak256(
            abi.encode(VOTE_TYPEHASH, context.projectId, context.contributionId, vote.voter, vote.choice, vote.nonce)
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    function _voteKey(address project, bytes32 contributionId, address voter, uint256 nonce)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(project, contributionId, voter, nonce));
    }
}
