#[starknet::interface]
pub trait IERC20<TContractState> {
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: starknet::ContractAddress) -> u256;
    fn allowance(
        self: @TContractState, owner: starknet::ContractAddress, spender: starknet::ContractAddress,
    ) -> u256;
    fn transfer(
        ref self: TContractState, recipient: starknet::ContractAddress, amount: u256,
    ) -> bool;
    fn transfer_from(
        ref self: TContractState,
        sender: starknet::ContractAddress,
        recipient: starknet::ContractAddress,
        amount: u256,
    ) -> bool;
    fn approve(ref self: TContractState, spender: starknet::ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
pub trait IBalloons<TContractState> {
    fn mint(ref self: TContractState, recipient: starknet::ContractAddress, amount: u256);
    fn burn(ref self: TContractState, amount: u256);
    fn get_owner(self: @TContractState) -> starknet::ContractAddress;
    fn transfer_ownership(ref self: TContractState, new_owner: starknet::ContractAddress);
}

#[starknet::contract]
pub mod Balloons {
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};
    use super::{IBalloons, IERC20};

    // Constants for safe math
    const MAX_U256: u256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    #[storage]
    struct Storage {
        name: ByteArray,
        symbol: ByteArray,
        decimals: u8,
        total_supply: u256,
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
        Approval: Approval,
        OwnershipTransferred: OwnershipTransferred,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        #[key]
        from: ContractAddress,
        #[key]
        to: ContractAddress,
        value: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Approval {
        #[key]
        owner: ContractAddress,
        #[key]
        spender: ContractAddress,
        value: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        #[key]
        previous_owner: ContractAddress,
        #[key]
        new_owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, recipient: ContractAddress, initial_supply: u256) {
        // Validate recipient is not zero address
        assert(!recipient.is_zero(), 'Recipient cannot be zero');
        assert(initial_supply > 0, 'Initial supply must be > 0');

        // Initialize token metadata
        self.name.write("Balloons");
        self.symbol.write("BAL");
        self.decimals.write(18);

        // Set owner
        self.owner.write(recipient);

        // Safe initialization of supply
        self.total_supply.write(initial_supply);
        self.balances.write(recipient, initial_supply);

        // Emit events
        self.emit(Transfer { from: Zero::zero(), to: recipient, value: initial_supply });

        self.emit(OwnershipTransferred { previous_owner: Zero::zero(), new_owner: recipient });
    }

    #[abi(embed_v0)]
    impl ERC20Impl of IERC20<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.decimals.read()
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress,
        ) -> u256 {
            self.allowances.read((owner, spender))
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let sender = get_caller_address();
            self._transfer(sender, recipient, amount);
            true
        }

        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let caller = get_caller_address();
            let current_allowance = self.allowances.read((sender, caller));

            // Check allowance
            assert(current_allowance >= amount, 'ERC20: insufficient allowance');

            // Update allowance with safe math
            let new_allowance = current_allowance - amount;
            self.allowances.write((sender, caller), new_allowance);

            // Emit Approval event when allowance changes (ERC20 standard)
            self.emit(Approval { owner: sender, spender: caller, value: new_allowance });

            self._transfer(sender, recipient, amount);
            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let owner = get_caller_address();

            // Validate spender is not zero address
            assert(!spender.is_zero(), 'Spender cannot be zero');

            // Approve race condition protection
            let current_allowance = self.allowances.read((owner, spender));
            assert(amount == 0 || current_allowance == 0, 'Must reset allowance to 0 first');

            self.allowances.write((owner, spender), amount);

            self.emit(Approval { owner, spender, value: amount });
            true
        }
    }

    #[abi(embed_v0)]
    impl BalloonsImpl of IBalloons<ContractState> {
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            // Access control - only owner can mint
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner can mint');

            // Validate recipient
            assert(!recipient.is_zero(), 'Cannot mint to zero address');
            assert(amount > 0, 'Amount must be > 0');

            // Safe math checks
            let current_total = self.total_supply.read();
            let current_balance = self.balances.read(recipient);

            // Check for overflow
            assert(MAX_U256 - current_total >= amount, 'Total supply overflow');
            assert(MAX_U256 - current_balance >= amount, 'Balance overflow');

            // Update state
            let new_total = current_total + amount;
            let new_balance = current_balance + amount;

            self.total_supply.write(new_total);
            self.balances.write(recipient, new_balance);

            // Emit event
            self.emit(Transfer { from: Zero::zero(), to: recipient, value: amount });
        }

        fn burn(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            let balance = self.balances.read(caller);
            let current_total = self.total_supply.read();

            // Validate burn amount
            assert(amount > 0, 'Amount must be > 0');
            assert(balance >= amount, 'Insufficient balance to burn');
            assert(current_total >= amount, 'Total supply underflow');

            // Update state
            self.balances.write(caller, balance - amount);
            self.total_supply.write(current_total - amount);

            // Emit event
            self.emit(Transfer { from: caller, to: Zero::zero(), value: amount });
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
            let caller = get_caller_address();
            let current_owner = self.owner.read();

            // Access control
            assert(caller == current_owner, 'Only owner can transfer');
            assert(!new_owner.is_zero(), 'New owner cannot be zero');
            assert(new_owner != current_owner, 'Same owner');

            // Update ownership
            self.owner.write(new_owner);

            // Emit event
            self.emit(OwnershipTransferred { previous_owner: current_owner, new_owner: new_owner });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _transfer(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) {
            // Validate addresses
            assert(!sender.is_zero(), 'Sender cannot be zero');
            assert(!recipient.is_zero(), 'Recipient cannot be zero');
            assert(amount > 0, 'Amount must be > 0');

            // Check sender balance
            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, 'ERC20: insufficient balance');

            // Safe math for recipient balance
            let recipient_balance = self.balances.read(recipient);
            assert(MAX_U256 - recipient_balance >= amount, 'Recipient balance overflow');

            // Update balances
            self.balances.write(sender, sender_balance - amount);
            self.balances.write(recipient, recipient_balance + amount);

            // Emit transfer event
            self.emit(Transfer { from: sender, to: recipient, value: amount });
        }
    }
}
