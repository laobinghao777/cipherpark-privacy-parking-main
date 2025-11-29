// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ParkingFeeCalculator
 * @notice Privacy-preserving parking fee calculator using FHE:
 *  - Input: encrypted minutes (euint64)
 *  - Rounds up to 30-min blocks: ceil(minutes / 30) without division
 *  - Cost: blocks * pricePerBlock (in cents)
 *  - Decryption: user-only via Relayer SDK userDecrypt
 */
contract ParkingFeeCalculator is ZamaEthereumConfig {
    /* ─── Constants and Owner ─────────────────────────────────────────── */
    uint64 public constant BLOCK_MINUTES = 30;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint64 pricePerBlock_, uint16 maxBlocks_) {
        require(pricePerBlock_ > 0, "price=0");
        require(maxBlocks_ > 0, "maxBlocks=0");
        owner = msg.sender;
        pricePerBlock = pricePerBlock_;
        maxBlocks = maxBlocks_;
    }

    function transferOwnership(address n) external onlyOwner {
        require(n != address(0), "Zero owner");
        owner = n;
    }

    function version() external pure returns (string memory) {
        return "ParkingFeeCalculator/1.0.3-sepolia";
    }

    /* ─── Pricing Parameters ──────────────────────────────────────────────── */
    /// @notice Price per 30-minute block, in cents
    uint64 public pricePerBlock;

    /// @notice Maximum billable blocks (e.g., 96 = 48 hours)
    uint16 public maxBlocks;

    function setPricePerBlock(uint64 newPrice) external onlyOwner {
        require(newPrice > 0, "price=0");
        pricePerBlock = newPrice;
    }

    function setMaxBlocks(uint16 newMax) external onlyOwner {
        require(newMax > 0, "maxBlocks=0");
        maxBlocks = newMax;
    }

    /* ─── Storage for User Results ───────────────────────────── */
    mapping(address => euint64) private _lastFee; // Last calculated fee (encrypted)

    /* ─── Events ──────────────────────────────────────────────────────── */
    event Quoted(address indexed user, bytes32 feeHandle);

    /* ─── Public Handle Getters ────────────────────────────────────── */
    function getMyFeeHandle() external view returns (bytes32) {
        return FHE.toBytes32(_lastFee[msg.sender]);
    }

    /* ─── Internal Helper: MSB Position for uint16 ──────────────── */
    function _msbPos(uint16 x) internal pure returns (uint8) {
        uint8 p = 0;
        while (x > 1) {
            x >>= 1;
            unchecked {
                ++p;
            }
        }
        return p; // For x>=1 returns MSB position (0-based)
    }

    /* ─── Main Logic ──────────────────────────────────────────────── */

    /**
     * @notice Calculate fee for encrypted minutes and store ciphertext,
     *         accessible to user for decryption (userDecrypt).
     * @param minutesExt  External euint64 (encrypted minutes)
     * @param proof       Attestation from Relayer SDK for minutesExt
     * @return feeHandle  bytes32 handle to encrypted fee
     */
    function quote(externalEuint64 minutesExt, bytes calldata proof) external returns (bytes32 feeHandle) {
        require(proof.length > 0, "Empty proof");

        // 1) Import encrypted minutes
        euint64 rem = FHE.fromExternal(minutesExt, proof);

        // 2) Fast floor(minutes / 30) without div:
        //    Binary subtraction by chunks of 30 * 2^k
        //    Then add +1 if remainder > 0 (ceil)
        euint64 blocks = FHE.asEuint64(0);

        // Use MSB of maxBlocks (sufficient ~16 iterations)
        uint8 kMax = _msbPos(maxBlocks); // 0..15 for maxBlocks<=65535

        // Iterate k = kMax..0
        for (uint8 ki = kMax + 1; ki > 0; ) {
            unchecked {
                --ki;
            }
            uint8 k = ki;
            // chunk = 30 * (1 << k)
            uint64 chunk = uint64(BLOCK_MINUTES) * (uint64(1) << k);

            // Check rem >= chunk. Library may not have gte, use gt(rem, chunk-1)
            ebool ge = FHE.gt(rem, FHE.asEuint64(chunk - 1));

            // rem = ge ? (rem - chunk) : rem
            euint64 remMinus = FHE.sub(rem, FHE.asEuint64(chunk));
            rem = FHE.select(ge, remMinus, rem);

            // blocks = ge ? (blocks + (1 << k)) : blocks
            euint64 addBy = FHE.asEuint64(uint64(1) << k);
            euint64 blocksPlus = FHE.add(blocks, addBy);
            blocks = FHE.select(ge, blocksPlus, blocks);
        }

        // Ceil: if remainder > 0, add 1 block
        ebool hasRem = FHE.gt(rem, FHE.asEuint64(0));
        blocks = FHE.select(hasRem, FHE.add(blocks, FHE.asEuint64(1)), blocks);

        // 3) Cap blocks at maxBlocks
        ebool tooMany = FHE.gt(blocks, FHE.asEuint64(maxBlocks));
        blocks = FHE.select(tooMany, FHE.asEuint64(maxBlocks), blocks);

        // 4) fee = blocks * pricePerBlock (in cents)
        euint64 fee = FHE.mul(blocks, FHE.asEuint64(pricePerBlock));

        // 5) Store fee and grant permissions:
        _lastFee[msg.sender] = fee;

        // - To contract: to reuse this value in future
        FHE.allowThis(_lastFee[msg.sender]);

        // - To user: to enable userDecrypt via Relayer SDK
        FHE.allow(_lastFee[msg.sender], msg.sender);

        // 6) Return handle to user
        feeHandle = FHE.toBytes32(_lastFee[msg.sender]);
        emit Quoted(msg.sender, feeHandle);
    }
}
