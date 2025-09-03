use starknet::ContractAddress;

// Real wallet address deployed on Sepolia
const OWNER: ContractAddress = 0x02dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A5918
    .try_into()
    .unwrap();

#[test]
fn test_basic_math() {
    let a = 1000_u256;
    let b = 500_u256;
    let result = a + b;
    assert(result == 1500, 'Basic math should work');
}

#[test]
fn test_address_creation() {
    let addr = OWNER;
    let zero_addr: ContractAddress = 0.try_into().unwrap();
    assert(addr != zero_addr, 'Address should be non-zero');
}
