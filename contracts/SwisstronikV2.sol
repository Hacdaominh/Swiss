// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SwisstronikV2 {
    uint256 private value;

    function setValue(uint256 _value) public {
        value = _value * 2;
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    fallback() external payable {}
}
