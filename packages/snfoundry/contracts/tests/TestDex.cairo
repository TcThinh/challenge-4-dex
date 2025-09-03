use contracts::DEX::{IDEXDispatcher, IDEXDispatcherTrait};
use openzeppelin_testing::declare_and_deploy;
use openzeppelin_utils::serde::SerializedAppend;
use starknet::ContractAddress;

// Real wallet address deployed on Sepolia
const OWNER: ContractAddress = 0x02dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A5918
    .try_into()
    .unwrap();

const STRK_TOKEN_CONTRACT_ADDRESS: ContractAddress =
    0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
    .try_into()
    .unwrap();

const INITIAL_SUPPLY: u256 = 1000000000000000000000; // 1000 * 10^18

fn deploy_balloons() -> ContractAddress {
    let mut calldata = array![];
    calldata.append_serde(OWNER);
    calldata.append_serde(INITIAL_SUPPLY);
    declare_and_deploy("Balloons", calldata)
}

fn deploy_dex(token_address: ContractAddress, strk_address: ContractAddress) -> ContractAddress {
    let mut calldata = array![];
    calldata.append_serde(token_address);
    calldata.append_serde(strk_address);
    declare_and_deploy("DEX", calldata)
}

#[test]
fn test_dex_deployment() {
    let balloons_address = deploy_balloons();
    let dex_address = deploy_dex(balloons_address, STRK_TOKEN_CONTRACT_ADDRESS);

    let dex_dispatcher = IDEXDispatcher { contract_address: dex_address };

    // DEX should start with zero liquidity
    let total_liquidity = dex_dispatcher.get_total_liquidity();
    assert(total_liquidity == 0, 'Should start with 0 liquidity');

    let token_reserve = dex_dispatcher.get_token_reserve();
    let strk_reserve = dex_dispatcher.get_strk_reserve();

    assert(token_reserve == 0, 'Token reserve should be 0');
    assert(strk_reserve == 0, 'STRK reserve should be 0');
}

#[test]
fn test_price_calculation() {
    let balloons_address = deploy_balloons();
    let dex_address = deploy_dex(balloons_address, STRK_TOKEN_CONTRACT_ADDRESS);
    let dex_dispatcher = IDEXDispatcher { contract_address: dex_address };

    // Test price calculation
    let token_amount = 1000000000000000000; // 1 * 10^18
    let token_reserve = 500000000000000000000; // 500 * 10^18
    let strk_reserve = 500000000000000000000; // 500 * 10^18

    let expected_strk_out = dex_dispatcher.price(token_amount, token_reserve, strk_reserve);
    assert(expected_strk_out > 0, 'Should return positive STRK');
}
