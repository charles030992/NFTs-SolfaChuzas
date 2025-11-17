// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyToken is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // By default transferability is disabled (only owner can transfer). Owner can enable it later.
    bool public transferable = false;

    constructor() ERC721("Solfachuzas Player", "SLF") {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /// @notice Batch mint multiple tokens to given recipients with corresponding tokenURIs.
    /// @dev recipients.length must equal uris.length
    function batchMint(address[] calldata recipients, string[] calldata uris) external onlyOwner {
        require(recipients.length == uris.length, "recipients and uris length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);
        }
    }

    /// @notice Enable or disable transfers. Only owner can call.
    function setTransferable(bool _t) external onlyOwner {
        transferable = _t;
    }

    // Block transfers unless transferability is enabled or the caller is owner (owner can move tokens).
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override
    {
        // allow minting (from == 0) and burning (to == 0)
        if (from != address(0) && to != address(0)) {
            if (!transferable) {
                // only owner may perform transfers while locked
                require(msg.sender == owner(), "transfers are disabled");
            }
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
