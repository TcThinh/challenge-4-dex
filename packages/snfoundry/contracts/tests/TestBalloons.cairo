use contracts::Balloons::{IBalloonsDispatcher, IBalloonsDispatcherTrait};
use openzeppelin_token::erc20::interface::{
    IERC20Dispatcher, IERC20DispatcherTrait, IERC20MetadataDispatcher,
    IERC20MetadataDispatcherTrait,
};
use snforge_std::{CheatSpan, cheat_caller_address, declare, ContractClassTrait, DeclareResultTrait};
use starknet::ContractAddress;

// Real wallet address deployed on Sepolia
const OWNER: ContractAddress = 0x02dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A5918
    .try_into()
    .unwrap();

const RECIPIENT: ContractAddress = 0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef12
    .try_into()
    .unwrap();

const INITIAL_SUPPLY: u256 = 1000000000000000000000; // 1000 * 10^18
const MINT_AMOUNT: u256 = 100000000000000000000; // 100 * 10^18

fn deploy_balloons() -> ContractAddress {
    let contract = declare("Balloons").unwrap().contract_class();
    let constructor_calldata = array![
        OWNER.into(), INITIAL_SUPPLY.low.into(), INITIAL_SUPPLY.high.into(),
    ];
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

#[test]
fn test_balloons_deployment() {
    let contract_address = deploy_balloons();

    let balloons_dispatcher = IBalloonsDispatcher { contract_address };
    let erc20_dispatcher = IERC20Dispatcher { contract_address };
    let metadata_dispatcher = IERC20MetadataDispatcher { contract_address };

    // Test metadata
    assert(metadata_dispatcher.name() == "Balloons", 'Wrong token name');
    assert(metadata_dispatcher.symbol() == "BAL", 'Wrong token symbol');
    assert(metadata_dispatcher.decimals() == 18, 'Wrong decimals');

    // Test initial supply - should be minted to owner
    assert(erc20_dispatcher.total_supply() == INITIAL_SUPPLY, 'Wrong total supply');
    assert(erc20_dispatcher.balance_of(OWNER) == INITIAL_SUPPLY, 'Wrong owner balance');

    // Test ownership
    assert(balloons_dispatcher.get_owner() == OWNER, 'Wrong owner');
}

#[test]
fn test_balloons_mint() {
    let contract_address = deploy_balloons();

    let balloons_dispatcher = IBalloonsDispatcher { contract_address };
    let erc20_dispatcher = IERC20Dispatcher { contract_address };

    let initial_recipient_balance = erc20_dispatcher.balance_of(RECIPIENT);
    let initial_total_supply = erc20_dispatcher.total_supply();

    // Only owner can mint
    cheat_caller_address(contract_address, OWNER, CheatSpan::TargetCalls(1));
    balloons_dispatcher.mint(RECIPIENT, MINT_AMOUNT);

    // Verify mint results
    assert(
        erc20_dispatcher.balance_of(RECIPIENT) == initial_recipient_balance + MINT_AMOUNT,
        'Wrong recipient balance',
    );
    assert(
        erc20_dispatcher.total_supply() == initial_total_supply + MINT_AMOUNT, 'Wrong total supply',
    );
}

#[test]
fn test_balloons_transfer() {
    let contract_address = deploy_balloons();
    let erc20_dispatcher = IERC20Dispatcher { contract_address };

    let transfer_amount = 50000000000000000000; // 50 * 10^18
    let owner_initial_balance = erc20_dispatcher.balance_of(OWNER);
    let recipient_initial_balance = erc20_dispatcher.balance_of(RECIPIENT);

    // Owner transfers tokens to recipient
    cheat_caller_address(contract_address, OWNER, CheatSpan::TargetCalls(1));
    let success = erc20_dispatcher.transfer(RECIPIENT, transfer_amount);

    assert(success, 'Transfer should succeed');
    assert(
        erc20_dispatcher.balance_of(OWNER) == owner_initial_balance - transfer_amount,
        'Wrong owner balance',
    );
    assert(
        erc20_dispatcher.balance_of(RECIPIENT) == recipient_initial_balance + transfer_amount,
        'Wrong recipient balance',
    );
}

#[test]
#[should_panic(expected: ('Only owner can mint',))]
fn test_balloons_mint_unauthorized() {
    let contract_address = deploy_balloons();
    let balloons_dispatcher = IBalloonsDispatcher { contract_address };

    // Try to mint from non-owner account
    cheat_caller_address(contract_address, RECIPIENT, CheatSpan::TargetCalls(1));
    balloons_dispatcher.mint(RECIPIENT, MINT_AMOUNT);
}
