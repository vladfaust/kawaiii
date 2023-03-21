// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Kawaiii™️ Collectible
 * @author Kawaiii™️ Team <inbox@kawaiii.co>
 */
contract KawaiiiCollectible is ERC1155, Ownable, ERC1155Supply, IERC2981, EIP712 {
    /// A to-be-signed request to create a new collectible.
    struct CreateRequest {
        uint256 tokenId;
        uint256 editions;
        uint256 mintPrice;
        uint8 royalty;
    }

    /// Emitted when a new collectible is created.
    event Create(address operator, address indexed creator, uint256 indexed tokenId);

    /// Emitted when a collectible is minted.
    event Mint(
        address operator,
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 income,
        uint256 ownerFee,
        uint256 profit
    );

    /// The typehash for the `CreateRequest` struct used by EIP-712.
    bytes32 public constant CREATE_TYPEHASH =
        keccak256("CreateRequest(uint256 tokenId,uint256 editions,uint256 mintPrice,uint8 royalty)");

    /// The fee for the contract owner, 0-255.
    uint8 public ownerFee;

    /// The creator of each token ID.
    mapping(uint256 => address) public creator;

    /// Number of editions for each token ID.
    mapping(uint256 => uint256) public editions;

    /// The mint price for each token ID.
    mapping(uint256 => uint256) public mintPrice;

    /// Royalty fee for each token ID, 0-255.
    mapping(uint256 => uint8) public royalty;

    constructor(
        string memory erc1155Uri,
        string memory eip712Name,
        string memory eip712Version,
        uint8 ownerFee_
    ) ERC1155(erc1155Uri) EIP712(eip712Name, eip712Version) {
        ownerFee = ownerFee_;
    }

    /**
     * Create a new collectible, making the caller the creator.
     */
    function create(uint256 tokenId, uint256 editions_, uint256 mintPrice_, uint8 royalty_) external {
        _create(msg.sender, tokenId, editions_, mintPrice_, royalty_);
    }

    /**
     * Create a new collectible, making the signer the creator.
     */
    function createWithSignature(
        address creator_,
        uint256 tokenId,
        uint256 editions_,
        uint256 mintPrice_,
        uint8 royalty_,
        bytes calldata signature
    ) external {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(CREATE_TYPEHASH, tokenId, editions_, mintPrice_, royalty_))
        );

        address signer = ECDSA.recover(digest, signature);
        require(signer == creator_, "KawaiiiCollectible: invalid signature");

        _create(creator_, tokenId, editions_, mintPrice_, royalty_);
    }

    /**
     * Mint a collectible.
     * The caller must send the exact required amount of ETH.
     */
    function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) public payable {
        require(msg.value == mintPrice[tokenId] * amount, "KawaiiiCollectible: incorrect value");
        require(totalSupply(tokenId) + amount <= editions[tokenId], "KawaiiiCollectible: insufficient editions");

        uint256 profit = msg.value;
        uint256 ownerFee_ = 0;

        // Transfer the owner fee to the owner.
        if (ownerFee > 0) {
            ownerFee_ = (msg.value * ownerFee) / type(uint8).max;

            if (ownerFee_ > 0) {
                payable(owner()).transfer(ownerFee_);
                unchecked {
                    profit -= ownerFee_;
                }
            }
        }

        // Transfer the remaining profit to the creator.
        payable(creator[tokenId]).transfer(profit);

        _mint(to, tokenId, amount, data);

        emit Mint(msg.sender, to, tokenId, amount, msg.value, ownerFee_, profit);
    }

    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        receiver = creator[tokenId];
        royaltyAmount = (salePrice * royalty[tokenId]) / type(uint8).max;
    }

    function _create(
        address creator_,
        uint256 tokenId,
        uint256 editions_,
        uint256 mintPrice_,
        uint8 royalty_
    ) internal {
        require(editions_ > 0, "KawaiiiCollectible: editions must be greater than 0");
        require(mintPrice_ > 0, "KawaiiiCollectible: mint price must be greater than 0");
        require(creator[tokenId] == address(0), "KawaiiiCollectible: token already exists");

        creator[tokenId] = creator_;
        editions[tokenId] = editions_;
        mintPrice[tokenId] = mintPrice_;
        royalty[tokenId] = royalty_;

        emit Create(msg.sender, creator_, tokenId);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
