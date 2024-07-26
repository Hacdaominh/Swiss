// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract SwisstronikProxyAdmin is ProxyAdmin {
    constructor(address _owner) ProxyAdmin(_owner) {}
}
