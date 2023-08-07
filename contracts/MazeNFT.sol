// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

// make sure to change the contract Name
contract SD2023 is
    Initializable,
    ERC721URIStorageUpgradeable,
    PausableUpgradeable,
    ERC721BurnableUpgradeable,
    ERC721RoyaltyUpgradeable,
    AccessControlUpgradeable
{
    using StringsUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Contract URI
    string public contractURI;
    // Storing base URI in state variable
    string private baseURI;

    uint256 public totalSupply;

    address collector;

    // Addresses of approved marketplace contracts
    mapping(address => bool) marketPlaceAddresses;

    CountersUpgradeable.Counter private _tokenIdCounter;
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER");
    bytes32 public constant OWNER_ROLE = keccak256("OWNER");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with required parameters
     * @param _name The name of the NFT contract
     * @param _symbol The symbol of the NFT contract
     * @param _contractURI The URI for the contract metadata
     * @param _baseUri The base URI for the NFTs
     * @param _supplyCap The total supply cap of the NFTs
     * @param _manager The address of the contract manager
     * @param _owner The address of the contract owner
     */
    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        string memory _baseUri,
        uint256 _supplyCap,
        address _manager,
        address _owner,
        address _openSeaProxy
    )
        public
        initializer
        isEmptyString(_baseUri)
        isNullAddress(_manager)
        isNullAddress(_owner)
    {
        __ERC721_init(_name, _symbol);
        __ERC721URIStorage_init();
        __Pausable_init();
        __ERC721Burnable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, _manager);
        _grantRole(OWNER_ROLE, _owner);
        contractURI = _contractURI;
        totalSupply = _supplyCap;
        baseURI = _baseUri;
        collector = _owner;
        addMarketPlaceAddress(_openSeaProxy);
    }

    /**
     * @dev Modifier to check for an empty string
     * @param _uri The string to check
     */
    modifier isEmptyString(string memory _uri) {
        if (bytes(_uri).length == 0) revert EmptyString();
        _;
    }

    /**
     * @dev Modifier to check for a null address
     * @param _address The address to check
     */
    modifier isNullAddress(address _address) {
        if (_address == address(0)) revert NullAddress();
        _;
    }

    // Custom error declarations
    error ZeroAmount();
    error EmptyString();
    error NullAddress();
    error CanNotMintZeroNFT();
    error SupplyReachedAt(uint256 id);

    // Event emitted when NFTs are minted
    event Mint(address indexed account, uint256 indexed numOfNFT);

    // Event emitted when URI is updated
    event SetUri(string oldURI, string newURI);

    // Event emitted when a marketplace address is removed
    event RemovedMarketPlace(address indexed marketPlaceAddress);

    // Event emitted when a marketplace address is added
    event AddMarketPlace(address indexed marketPlaceAddress);
    event SetContractURI(string oldURI, string newURI);

    /**
     * @dev Add an approved marketplace contract address
     * @param marketPlaceAddress The address of the marketplace contract
     */
    /**
     * @dev Retrieves the base URI for the NFTs
     */
    function setContractURI(
        string memory _contractURI
    ) external isEmptyString(_contractURI) onlyRole(MANAGER_ROLE) {
        emit SetContractURI(contractURI, _contractURI);
        contractURI = _contractURI;
    }
    /**
     * Function to set royalty per tokenId - This does not work for Opensea -Just for other market places
     * Can only be called by the DEFAULT_ADMIN_ROLE 
     */
    function setRoyalty(uint256 tokenId, uint96 _royalty)
        external
        onlyRole(OWNER_ROLE)
    {
         _requireMinted(tokenId);
        _setTokenRoyalty(tokenId, collector, _royalty);
    }

    /**
     * @dev Sets the URI for the NFTs
     * @param newUri The new base URI for the NFTs
     */
    function setURI(
        string memory newUri
    ) external onlyRole(MANAGER_ROLE) isEmptyString(newUri) {
        emit SetUri(baseURI, newUri);
        baseURI = newUri;

    }

    /**
     * @dev Retrieves the base URI for the NFTs
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Pauses the contract
     */
    function pause() public onlyRole(MANAGER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() public onlyRole(MANAGER_ROLE) {
        _unpause();
    }

    function addMarketPlaceAddress(
        address marketPlaceAddress
    ) public onlyRole(MANAGER_ROLE) isNullAddress(marketPlaceAddress) {
        marketPlaceAddresses[marketPlaceAddress] = true;
        emit AddMarketPlace(marketPlaceAddress);
    }

    /**
     * @dev Remove an approved marketplace contract address
     * @param marketPlaceAddress The address of the marketplace contract
     */
    function removeMarketPlaceAddress(
        address marketPlaceAddress
    ) external onlyRole(MANAGER_ROLE) isNullAddress(marketPlaceAddress) {
        marketPlaceAddresses[marketPlaceAddress] = false;
        emit RemovedMarketPlace(marketPlaceAddress);
    }

    /**
     * @dev Safely mints NFTs
     * @param _numOfNFT The number of NFTs to mint
     */
    function safeMint(uint256 _numOfNFT) external onlyRole(OWNER_ROLE) {
        if (_numOfNFT == 0) revert CanNotMintZeroNFT();
        uint256 currentId = _tokenIdCounter.current();
        uint256 totalToken = currentId + _numOfNFT;
        if (totalToken > totalSupply) revert SupplyReachedAt(totalToken);
        for (uint256 i = 0; i < _numOfNFT; ) {
            _tokenIdCounter.increment();
            _safeMint(msg.sender, _tokenIdCounter.current());
            unchecked {
                i++;
            }
        }
        emit Mint(msg.sender, _numOfNFT);
    }

    /**
     * @dev Checks if the operator is approved for all tokens of the owner
     * @param _owner The owner of the tokens
     * @param _operator The operator
     * @return isOperator Whether the operator is approved
     */
    function isApprovedForAll(
        address _owner,
        address _operator
    )
        public
        view
        override(ERC721Upgradeable, IERC721Upgradeable)
        returns (bool isOperator)
    {
        // if marketplace ERC721 Proxy Address is detected, auto-return true
        if (marketPlaceAddresses[_operator]) {
            return true;
        }
        // otherwise, use the default ERC721.isApprovedForAll()
        return ERC721Upgradeable.isApprovedForAll(_owner, _operator);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // The following functions are overrides required by Solidity.

    function _burn(
        uint256 tokenId
    )
        internal
        override(
            ERC721Upgradeable,
            ERC721URIStorageUpgradeable,
            ERC721RoyaltyUpgradeable
        )
    {
        super._burn(tokenId);
         _resetTokenRoyalty(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return string(abi.encodePacked(super.tokenURI(tokenId), ".json"));
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC721Upgradeable,
            ERC721URIStorageUpgradeable,
            ERC721RoyaltyUpgradeable,
            AccessControlUpgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
