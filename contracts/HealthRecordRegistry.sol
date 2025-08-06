// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title HealthRecordRegistry
 * @dev Smart contract for immutable medical record hash storage and verification
 * @notice This contract stores hashes of encrypted medical files for integrity verification
 */
contract HealthRecordRegistry is Ownable, ReentrancyGuard, Pausable {
    // Struct to store medical record metadata
    struct MedicalRecord {
        bytes32 fileHash;         // SHA-256 hash of encrypted file
        string ipfsCid;           // IPFS Content Identifier
        uint256 timestamp;        // Upload timestamp
        string recordType;        // Type of medical record (e.g., "lab", "imaging", "prescription")
        uint256 fileSize;         // Original file size in bytes
        bool isActive;            // Whether record is active
        uint256 accessCount;      // Number of times accessed
        string metadataHash;      // Hash of encrypted metadata
    }

    // Mapping from user address to their medical records
    mapping(address => mapping(uint256 => MedicalRecord)) private userRecords;
    
    // Mapping from user address to number of records
    mapping(address => uint256) private userRecordCount;
    
    // Mapping from file hash to user address (for integrity verification)
    mapping(bytes32 => address) private fileHashToUser;
    
    // Mapping for user registration status
    mapping(address => bool) private registeredUsers;
    
    // Mapping for authorized backend services (split-key verification)
    mapping(address => bool) private authorizedServices;
    
    // Total number of records in the system
    uint256 public totalRecords;
    
    // Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event MedicalRecordStored(
        address indexed user,
        uint256 indexed recordId,
        bytes32 indexed fileHash,
        string ipfsCid,
        string recordType,
        uint256 timestamp
    );
    event MedicalRecordAccessed(
        address indexed user,
        uint256 indexed recordId,
        address indexed accessor,
        uint256 timestamp
    );
    event RecordDeactivated(
        address indexed user,
        uint256 indexed recordId,
        uint256 timestamp
    );
    event ServiceAuthorized(address indexed service, bool authorized);
    
    // Modifiers
    modifier onlyRegisteredUser() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }
    
    modifier onlyAuthorizedService() {
        require(authorizedServices[msg.sender], "Service not authorized");
        _;
    }
    
    modifier validRecordId(address user, uint256 recordId) {
        require(recordId < userRecordCount[user], "Invalid record ID");
        require(userRecords[user][recordId].isActive, "Record not active");
        _;
    }

    constructor() {
        // Contract deployer is automatically authorized
        authorizedServices[msg.sender] = true;
        emit ServiceAuthorized(msg.sender, true);
    }

    /**
     * @dev Register a new user
     * @notice Users must register before storing medical records
     */
    function registerUser() external whenNotPaused {
        require(!registeredUsers[msg.sender], "User already registered");
        
        registeredUsers[msg.sender] = true;
        emit UserRegistered(msg.sender, block.timestamp);
    }

    /**
     * @dev Store a medical record hash
     * @param fileHash SHA-256 hash of the encrypted medical file
     * @param ipfsCid IPFS Content Identifier
     * @param recordType Type of medical record
     * @param fileSize Original file size in bytes
     * @param metadataHash Hash of encrypted metadata
     */
    function storeMedicalRecord(
        bytes32 fileHash,
        string calldata ipfsCid,
        string calldata recordType,
        uint256 fileSize,
        string calldata metadataHash
    ) external onlyRegisteredUser whenNotPaused nonReentrant {
        require(fileHash != bytes32(0), "Invalid file hash");
        require(bytes(ipfsCid).length > 0, "Invalid IPFS CID");
        require(bytes(recordType).length > 0, "Invalid record type");
        require(fileSize > 0, "Invalid file size");
        require(fileHashToUser[fileHash] == address(0), "File hash already exists");

        uint256 recordId = userRecordCount[msg.sender];
        
        // Store the medical record
        userRecords[msg.sender][recordId] = MedicalRecord({
            fileHash: fileHash,
            ipfsCid: ipfsCid,
            timestamp: block.timestamp,
            recordType: recordType,
            fileSize: fileSize,
            isActive: true,
            accessCount: 0,
            metadataHash: metadataHash
        });

        // Update mappings
        fileHashToUser[fileHash] = msg.sender;
        userRecordCount[msg.sender]++;
        totalRecords++;

        emit MedicalRecordStored(
            msg.sender,
            recordId,
            fileHash,
            ipfsCid,
            recordType,
            block.timestamp
        );
    }

    /**
     * @dev Verify if a medical record exists and belongs to a user
     * @param user User address
     * @param recordId Record ID
     * @param fileHash Expected file hash
     * @return exists Whether the record exists
     * @return matches Whether the hash matches
     * @return timestamp Upload timestamp
     */
    function verifyMedicalRecord(
        address user,
        uint256 recordId,
        bytes32 fileHash
    ) external view returns (bool exists, bool matches, uint256 timestamp) {
        if (recordId >= userRecordCount[user]) {
            return (false, false, 0);
        }

        MedicalRecord memory record = userRecords[user][recordId];
        
        if (!record.isActive) {
            return (false, false, 0);
        }

        exists = true;
        matches = (record.fileHash == fileHash);
        timestamp = record.timestamp;
    }

    /**
     * @dev Log medical record access (called by authorized services)
     * @param user User address
     * @param recordId Record ID
     */
    function logRecordAccess(
        address user,
        uint256 recordId
    ) external onlyAuthorizedService validRecordId(user, recordId) {
        userRecords[user][recordId].accessCount++;
        
        emit MedicalRecordAccessed(
            user,
            recordId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Get medical record details
     * @param user User address
     * @param recordId Record ID
     * @return record Medical record details
     */
    function getMedicalRecord(
        address user,
        uint256 recordId
    ) external view validRecordId(user, recordId) returns (MedicalRecord memory record) {
        return userRecords[user][recordId];
    }

    /**
     * @dev Get user's record count
     * @param user User address
     * @return count Number of records
     */
    function getUserRecordCount(address user) external view returns (uint256 count) {
        return userRecordCount[user];
    }

    /**
     * @dev Get user's active records (paginated)
     * @param user User address
     * @param offset Starting index
     * @param limit Maximum number of records to return
     * @return recordIds Array of record IDs
     * @return hashes Array of file hashes
     * @return timestamps Array of timestamps
     */
    function getUserRecords(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory recordIds,
        bytes32[] memory hashes,
        uint256[] memory timestamps
    ) {
        uint256 totalUserRecords = userRecordCount[user];
        require(offset < totalUserRecords, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > totalUserRecords) {
            end = totalUserRecords;
        }

        uint256 length = end - offset;
        recordIds = new uint256[](length);
        hashes = new bytes32[](length);
        timestamps = new uint256[](length);

        uint256 index = 0;
        for (uint256 i = offset; i < end; i++) {
            if (userRecords[user][i].isActive) {
                recordIds[index] = i;
                hashes[index] = userRecords[user][i].fileHash;
                timestamps[index] = userRecords[user][i].timestamp;
                index++;
            }
        }
    }

    /**
     * @dev Deactivate a medical record
     * @param recordId Record ID to deactivate
     */
    function deactivateRecord(
        uint256 recordId
    ) external onlyRegisteredUser validRecordId(msg.sender, recordId) {
        userRecords[msg.sender][recordId].isActive = false;
        
        emit RecordDeactivated(msg.sender, recordId, block.timestamp);
    }

    /**
     * @dev Get file hash owner
     * @param fileHash File hash to lookup
     * @return owner Owner address
     */
    function getFileHashOwner(bytes32 fileHash) external view returns (address owner) {
        return fileHashToUser[fileHash];
    }

    /**
     * @dev Check if user is registered
     * @param user User address
     * @return registered Registration status
     */
    function isUserRegistered(address user) external view returns (bool registered) {
        return registeredUsers[user];
    }

    /**
     * @dev Get contract statistics
     * @return totalUsers Total registered users
     * @return totalRecordsCount Total records stored
     * @return contractBalance Contract balance
     */
    function getContractStats() external view returns (
        uint256 totalUsers,
        uint256 totalRecordsCount,
        uint256 contractBalance
    ) {
        // Note: This is a simplified implementation
        // In practice, you'd want to track total users more efficiently
        totalRecordsCount = totalRecords;
        contractBalance = address(this).balance;
        // totalUsers would need a separate counter for efficiency
        totalUsers = 0;
    }

    // Admin functions

    /**
     * @dev Authorize or deauthorize a service
     * @param service Service address
     * @param authorized Authorization status
     */
    function setServiceAuthorization(
        address service,
        bool authorized
    ) external onlyOwner {
        authorizedServices[service] = authorized;
        emit ServiceAuthorized(service, authorized);
    }

    /**
     * @dev Check if service is authorized
     * @param service Service address
     * @return authorized Authorization status
     */
    function isServiceAuthorized(address service) external view returns (bool authorized) {
        return authorizedServices[service];
    }

    /**
     * @dev Emergency pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Events for enhanced monitoring
    event ContractUpgraded(address indexed oldContract, address indexed newContract);
    event SecurityAlert(string indexed alertType, address indexed user, uint256 timestamp);
}
