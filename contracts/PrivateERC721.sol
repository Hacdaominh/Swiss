// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrivateERC721 is ERC721, Ownable {
    uint256 private _nextTokenId;
    constructor() ERC721("PrivateERC721", "SWTR") Ownable(msg.sender) {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    /**
     * @dev Regular `balanceOf` function marked as internal, so we override it to extend visibility
     */
    function balanceOf(address account) public view override returns (uint256) {
        // This function should be called by EOA using signed `eth_call` to make EVM able to
        // extract original sender of this request. In case of regular (non-signed) `eth_call`
        // msg.sender will be empty address (0x0000000000000000000000000000000000000000).
        require(msg.sender == account, "PERC20Sample: msg.sender != account");

        // If msg.sender is correct we return the balance
        super.balanceOf(account);
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view override(ERC721) returns (bool) {
        require(msg.sender == owner, "PERC20Sample: msg.sender != owner");
        super.isApprovedForAll(owner, operator);
    }
}
