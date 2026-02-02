/**
 * Compile ERC20 contract and output bytecode
 */
const solc = require('solc');

const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TIPLToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        totalSupply = 10_000_000 * 10 ** 18;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "ERC20: insufficient allowance");
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "ERC20: transfer from zero");
        require(to != address(0), "ERC20: transfer to zero");
        require(balanceOf[from] >= amount, "ERC20: insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
`;

const input = {
    language: 'Solidity',
    sources: {
        'TIPLToken.sol': {
            content: contractSource
        }
    },
    settings: {
        optimizer: {
            enabled: true,
            runs: 200
        },
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode.object']
            }
        }
    }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
    output.errors.forEach(err => {
        console.error(err.formattedMessage);
    });
}

const contract = output.contracts['TIPLToken.sol']['TIPLToken'];
const bytecode = '0x' + contract.evm.bytecode.object;
const abi = contract.abi;

console.log('Bytecode length:', bytecode.length, 'chars =', (bytecode.length - 2) / 2, 'bytes');
console.log('\nBytecode:');
console.log(bytecode);

// Verify the bytecode structure
const bc = bytecode.slice(2);
// Find the runtime size in the init code
const match = bc.match(/61([0-9a-f]{4})38/);
if (match) {
    const runtimeSize = parseInt(match[1], 16);
    const totalBytes = bc.length / 2;
    console.log('\nClaimed runtime size:', runtimeSize, 'bytes');
    console.log('Total bytecode:', totalBytes, 'bytes');
    console.log('Init code size:', totalBytes - runtimeSize, 'bytes');
}
