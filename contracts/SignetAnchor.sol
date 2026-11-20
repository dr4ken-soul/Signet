// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title SignetAnchor
/// @notice Buyer-controlled tUSD8 payment with invoice digest and off-chain
///         verification-record hash anchoring. This contract does NOT verify
///         ML-DSA signatures; the EVM cannot check them in this design. It
///         records commitments that reference off-chain verification evidence.
/// @dev Fixed, non-upgradeable, no owner, no fees, no proxy.
contract SignetAnchor {
    event PaymentAnchored(
        bytes32 indexed invoiceRefHash,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        uint256 nonce,
        uint64 expiry,
        bytes32 documentDigest,
        bytes32 verificationRecordHash
    );

    error Expired(uint64 expiry, uint64 blockTime);
    error BadToken();
    error BadPayee();
    error ZeroAmount();
    error AlreadyUsed(bytes32 invoiceRefHash, uint256 nonce);
    error TransferFailed();

    mapping(bytes32 invoiceRefHash => mapping(uint256 nonce => bool used)) public used;

    /// @notice Transfer `amount` of `token` from the buyer (msg.sender) to
    ///         `payee` and emit the anchoring event. The buyer must have set a
    ///         token allowance for this contract first.
    function payAndAnchor(
        address payee,
        address token,
        uint256 amount,
        uint256 nonce,
        uint64 expiry,
        bytes32 invoiceRefHash,
        bytes32 documentDigest,
        bytes32 verificationRecordHash
    ) external {
        if (expiry < block.timestamp) revert Expired(expiry, uint64(block.timestamp));
        if (token == address(0)) revert BadToken();
        if (payee == address(0)) revert BadPayee();
        if (amount == 0) revert ZeroAmount();
        if (used[invoiceRefHash][nonce]) revert AlreadyUsed(invoiceRefHash, nonce);
        used[invoiceRefHash][nonce] = true;
        if (!_transferFrom(token, msg.sender, payee, amount)) revert TransferFailed();
        emit PaymentAnchored(
            invoiceRefHash,
            msg.sender,
            payee,
            token,
            amount,
            nonce,
            expiry,
            documentDigest,
            verificationRecordHash
        );
    }

    function _transferFrom(address token, address from, address to, uint256 value) private returns (bool) {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, value)
        );
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }
}
