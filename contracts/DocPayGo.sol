// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract DocPayGo {
    enum ReservationStatus { None, Reserved, Finalized, Refunded, Expired }

    struct Reservation {
        address payer;
        uint64 sizeBytes;
        uint32 priceCents;
        uint40 createdAt;
        uint40 expiresAt;
        ReservationStatus status;
    }

    struct Doc {
        address author;
        string arweaveTx;
        string title;
        string mime;
        uint256 sizeBytes;
        uint256 timestamp;
    }

    mapping(bytes32 => Doc) public docs;
    mapping(bytes32 => Reservation) public reservations;

    event DocumentPosted(
        address indexed author,
        bytes32 indexed docId,
        string arweaveTx,
        uint256 sizeBytes,
        uint256 timestamp
    );
    event ReservationCreated(
        bytes32 indexed reservationId,
        address indexed payer,
        uint64 sizeBytes,
        uint32 priceCents,
        uint40 expiresAt
    );
    event ReservationFinalized(
        bytes32 indexed reservationId,
        bytes32 indexed docId,
        address indexed payer,
        string arTx
    );
    event ReservationRefunded(
        bytes32 indexed reservationId,
        address indexed payer
    );
    event ReservationExpired(
        bytes32 indexed reservationId,
        address indexed payer
    );
    event SignerUpdated(address indexed newSigner);

    address public owner;
    address public signer;
    IERC20 public immutable token;

    uint256 public constant CENT_TO_USDC = 1e4; // 1 cent = 0.01 USDC (6 decimals)
    bool private locked;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "reentrant");
        locked = true;
        _;
        locked = false;
    }

    constructor(address _token, address _signer) {
        require(_token != address(0), "token=0");
        require(_signer != address(0), "signer=0");
        owner = msg.sender;
        token = IERC20(_token);
        signer = _signer;
    }

    function updateSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "signer=0");
        signer = newSigner;
        emit SignerUpdated(newSigner);
    }

    function post(
        string calldata arTx,
        string calldata title,
        string calldata mime,
        uint256 sizeBytes,
        uint256 priceCents,
        uint256 expiresAt,
        bytes calldata signature
    ) external nonReentrant {
        require(bytes(arTx).length > 0, "arTx empty");
        require(sizeBytes > 0, "sizeBytes=0");
        require(block.timestamp <= expiresAt, "quote expired");

        bytes32 id = keccak256(abi.encodePacked(arTx));
        require(docs[id].author == address(0), "already posted");

        bytes32 digest = keccak256(
            abi.encodePacked(address(this), msg.sender, arTx, sizeBytes, priceCents, expiresAt)
        );
        address recovered = _recoverSigner(digest, signature);
        require(recovered == signer, "bad signature");

        uint256 usdcToPull = priceCents * CENT_TO_USDC;
        require(token.transferFrom(msg.sender, address(this), usdcToPull), "payment failed");

        docs[id] = Doc(msg.sender, arTx, title, mime, sizeBytes, block.timestamp);
        emit DocumentPosted(msg.sender, id, arTx, sizeBytes, block.timestamp);
    }

    function reservePost(
        uint64 sizeBytes,
        uint32 priceCents,
        uint40 expiresAt,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant returns (bytes32 reservationId) {
        require(sizeBytes > 0, "sizeBytes=0");
        require(priceCents > 0, "priceCents=0");
        require(expiresAt > block.timestamp, "quote expired");

        reservationId = keccak256(
            abi.encodePacked(
                address(this),
                msg.sender,
                sizeBytes,
                priceCents,
                expiresAt,
                nonce
            )
        );
        require(
            reservations[reservationId].status == ReservationStatus.None,
            "already reserved"
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                address(this),
                msg.sender,
                sizeBytes,
                priceCents,
                expiresAt,
                nonce
            )
        );
        address recovered = _recoverSigner(digest, signature);
        require(recovered == signer, "bad signature");

        uint256 usdcToPull = priceCents * CENT_TO_USDC;
        require(token.transferFrom(msg.sender, address(this), usdcToPull), "payment failed");

        reservations[reservationId] = Reservation({
            payer: msg.sender,
            sizeBytes: sizeBytes,
            priceCents: priceCents,
            createdAt: uint40(block.timestamp),
            expiresAt: expiresAt,
            status: ReservationStatus.Reserved
        });

        emit ReservationCreated(
            reservationId,
            msg.sender,
            sizeBytes,
            priceCents,
            expiresAt
        );

        return reservationId;
    }

    function finalizePost(
        bytes32 reservationId,
        string calldata arTx,
        string calldata title,
        string calldata mime
    ) external nonReentrant {
        require(bytes(arTx).length > 0, "arTx empty");

        Reservation storage reservation = reservations[reservationId];
        require(reservation.status == ReservationStatus.Reserved, "not reserved");
        require(reservation.payer == msg.sender, "not payer");

        bytes32 id = keccak256(abi.encodePacked(arTx));
        require(docs[id].author == address(0), "already posted");

        reservation.status = ReservationStatus.Finalized;

        docs[id] = Doc(
            reservation.payer,
            arTx,
            title,
            mime,
            reservation.sizeBytes,
            block.timestamp
        );
        emit DocumentPosted(reservation.payer, id, arTx, reservation.sizeBytes, block.timestamp);
        emit ReservationFinalized(reservationId, id, reservation.payer, arTx);
    }

    function withdraw(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "bad to");
        require(token.transfer(to, amount), "withdraw failed");
    }

    function _recoverSigner(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        if (sig.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        bytes32 ethSigned = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", digest)
        );
        return ecrecover(ethSigned, v, r, s);
    }
}
