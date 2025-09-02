#[starknet::interface]
pub trait IDEX<TContractState> {
    fn init(ref self: TContractState, tokens: u256, strk: u256) -> u256;
    fn price(
        self: @TContractState, input_amount: u256, input_reserve: u256, output_reserve: u256,
    ) -> u256;
    fn get_token_to_strk_price(self: @TContractState, token_amount: u256) -> u256;
    fn get_strk_to_token_price(self: @TContractState, strk_amount: u256) -> u256;
    fn strk_to_token(ref self: TContractState, strk_amount: u256) -> u256;
    fn token_to_strk(ref self: TContractState, tokens: u256) -> u256;
    fn deposit(ref self: TContractState, token_amount: u256, strk_amount: u256) -> u256;
    fn withdraw(ref self: TContractState, amount: u256) -> (u256, u256);
    fn get_total_liquidity(self: @TContractState) -> u256;
    fn get_liquidity(self: @TContractState, user: starknet::ContractAddress) -> u256;
    fn get_token_reserve(self: @TContractState) -> u256;
    fn get_strk_reserve(self: @TContractState) -> u256;
}

#[starknet::contract]
pub mod DEX {
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::IDEX;

    const MINIMUM_LIQUIDITY: u256 = 1000;

    #[storage]
    struct Storage {
        token: IERC20Dispatcher,
        reserve0: u256, // Token reserve
        reserve1: u256, // STRK reserve (simulated)
        total_liquidity: u256,
        liquidity: Map<ContractAddress, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        LiquidityProvided: LiquidityProvided,
        LiquidityRemoved: LiquidityRemoved,
        TokensSwapped: TokensSwapped,
    }

    #[derive(Drop, starknet::Event)]
    struct LiquidityProvided {
        #[key]
        liquidity_provider: ContractAddress,
        liquidity_minted: u256,
        strk_amount: u256,
        token_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct LiquidityRemoved {
        #[key]
        liquidity_provider: ContractAddress,
        liquidity_removed: u256,
        strk_amount: u256,
        token_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct TokensSwapped {
        #[key]
        swapper: ContractAddress,
        strk_input: u256,
        token_output: u256,
        token_input: u256,
        strk_output: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, token_addr: ContractAddress) {
        self.token.write(IERC20Dispatcher { contract_address: token_addr });
        self.reserve0.write(0);
        self.reserve1.write(0);
        self.total_liquidity.write(0);
    }

    #[abi(embed_v0)]
    impl DEXImpl of IDEX<ContractState> {
        fn init(ref self: ContractState, tokens: u256, strk: u256) -> u256 {
            assert(self.total_liquidity.read() == 0, 'DEX: already initialized');
            assert(tokens > 0, 'DEX: invalid token amount');
            assert(strk > 0, 'DEX: invalid strk amount');

            let caller = get_caller_address();
            let contract_addr = get_contract_address();

            // Transfer tokens from caller to DEX
            self.token.read().transfer_from(caller, contract_addr, tokens);

            // For STRK, we'll simulate by just tracking the amount
            let liquidity_minted = self._sqrt(tokens * strk);
            assert(liquidity_minted > MINIMUM_LIQUIDITY, 'DEX: insufficient liquidity');

            // Set reserves
            self.reserve0.write(tokens);
            self.reserve1.write(strk);

            // Mint liquidity tokens (simplified)
            let user_liquidity = liquidity_minted - MINIMUM_LIQUIDITY;
            self.liquidity.write(caller, user_liquidity);
            self.total_liquidity.write(liquidity_minted);

            self
                .emit(
                    LiquidityProvided {
                        liquidity_provider: caller,
                        liquidity_minted: user_liquidity,
                        strk_amount: strk,
                        token_amount: tokens,
                    },
                );

            user_liquidity
        }

        fn price(
            self: @ContractState, input_amount: u256, input_reserve: u256, output_reserve: u256,
        ) -> u256 {
            assert(input_amount > 0, 'DEX: insufficient input');
            assert(input_reserve > 0 && output_reserve > 0, 'DEX: insufficient liquidity');

            // Apply 0.3% fee (997/1000)
            let input_with_fee = input_amount * 997;
            let numerator = input_with_fee * output_reserve;
            let denominator = input_reserve * 1000 + input_with_fee;

            numerator / denominator
        }

        fn get_token_to_strk_price(self: @ContractState, token_amount: u256) -> u256 {
            let token_reserve = self.reserve0.read();
            let strk_reserve = self.reserve1.read();
            self.price(token_amount, token_reserve, strk_reserve)
        }

        fn get_strk_to_token_price(self: @ContractState, strk_amount: u256) -> u256 {
            let token_reserve = self.reserve0.read();
            let strk_reserve = self.reserve1.read();
            self.price(strk_amount, strk_reserve, token_reserve)
        }

        fn strk_to_token(ref self: ContractState, strk_amount: u256) -> u256 {
            assert(strk_amount > 0, 'DEX: invalid strk amount');

            let caller = get_caller_address();
            let token_reserve = self.reserve0.read();
            let strk_reserve = self.reserve1.read();

            let token_output = self.price(strk_amount, strk_reserve, token_reserve);
            assert(token_output > 0, 'DEX: insufficient output');
            assert(token_reserve >= token_output, 'DEX: insufficient liquidity');

            // Update reserves
            self.reserve0.write(token_reserve - token_output);
            self.reserve1.write(strk_reserve + strk_amount);

            // Transfer tokens to user
            self.token.read().transfer(caller, token_output);

            self
                .emit(
                    TokensSwapped {
                        swapper: caller,
                        strk_input: strk_amount,
                        token_output,
                        token_input: 0,
                        strk_output: 0,
                    },
                );

            token_output
        }

        fn token_to_strk(ref self: ContractState, tokens: u256) -> u256 {
            assert(tokens > 0, 'DEX: invalid token amount');

            let caller = get_caller_address();
            let contract_addr = get_contract_address();
            let token_reserve = self.reserve0.read();
            let strk_reserve = self.reserve1.read();

            let strk_output = self.price(tokens, token_reserve, strk_reserve);
            assert(strk_output > 0, 'DEX: insufficient output');
            assert(strk_reserve >= strk_output, 'DEX: insufficient liquidity');

            // Transfer tokens from user to DEX
            self.token.read().transfer_from(caller, contract_addr, tokens);

            // Update reserves
            self.reserve0.write(token_reserve + tokens);
            self.reserve1.write(strk_reserve - strk_output);

            self
                .emit(
                    TokensSwapped {
                        swapper: caller,
                        strk_input: 0,
                        token_output: 0,
                        token_input: tokens,
                        strk_output,
                    },
                );

            strk_output
        }

        fn deposit(ref self: ContractState, token_amount: u256, strk_amount: u256) -> u256 {
            assert(token_amount > 0, 'DEX: invalid token amount');
            assert(strk_amount > 0, 'DEX: invalid strk amount');

            let caller = get_caller_address();
            let contract_addr = get_contract_address();
            let token_reserve = self.reserve0.read();
            let strk_reserve = self.reserve1.read();
            let total_supply = self.total_liquidity.read();

            assert(total_supply > 0, 'DEX: not initialized');

            // Calculate proportional amounts
            let token_required = strk_amount * token_reserve / strk_reserve;
            let strk_required = token_amount * strk_reserve / token_reserve;

            let (actual_token, actual_strk) = if token_required <= token_amount {
                (token_required, strk_amount)
            } else {
                (token_amount, strk_required)
            };

            // Calculate liquidity to mint
            let liquidity = self
                ._min(
                    actual_token * total_supply / token_reserve,
                    actual_strk * total_supply / strk_reserve,
                );

            assert(liquidity > 0, 'DEX: insufficient liquidity');

            // Transfer tokens
            self.token.read().transfer_from(caller, contract_addr, actual_token);

            // Update reserves and liquidity
            self.reserve0.write(token_reserve + actual_token);
            self.reserve1.write(strk_reserve + actual_strk);

            let current_liquidity = self.liquidity.read(caller);
            self.liquidity.write(caller, current_liquidity + liquidity);
            self.total_liquidity.write(total_supply + liquidity);

            self
                .emit(
                    LiquidityProvided {
                        liquidity_provider: caller,
                        liquidity_minted: liquidity,
                        strk_amount: actual_strk,
                        token_amount: actual_token,
                    },
                );

            liquidity
        }

        fn withdraw(ref self: ContractState, amount: u256) -> (u256, u256) {
            assert(amount > 0, 'DEX: invalid amount');

            let caller = get_caller_address();
            let user_liquidity = self.liquidity.read(caller);
            assert(user_liquidity >= amount, 'DEX: insufficient balance');

            let token_reserve = self.reserve0.read();
            let strk_reserve = self.reserve1.read();
            let total_supply = self.total_liquidity.read();

            let token_amount = amount * token_reserve / total_supply;
            let strk_amount = amount * strk_reserve / total_supply;

            assert(token_amount > 0 && strk_amount > 0, 'DEX: insufficient burn');

            // Update liquidity and reserves
            self.liquidity.write(caller, user_liquidity - amount);
            self.total_liquidity.write(total_supply - amount);
            self.reserve0.write(token_reserve - token_amount);
            self.reserve1.write(strk_reserve - strk_amount);

            // Transfer tokens
            self.token.read().transfer(caller, token_amount);

            self
                .emit(
                    LiquidityRemoved {
                        liquidity_provider: caller,
                        liquidity_removed: amount,
                        strk_amount,
                        token_amount,
                    },
                );

            (token_amount, strk_amount)
        }

        fn get_total_liquidity(self: @ContractState) -> u256 {
            self.total_liquidity.read()
        }

        fn get_liquidity(self: @ContractState, user: ContractAddress) -> u256 {
            self.liquidity.read(user)
        }

        fn get_token_reserve(self: @ContractState) -> u256 {
            self.reserve0.read()
        }

        fn get_strk_reserve(self: @ContractState) -> u256 {
            self.reserve1.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _sqrt(self: @ContractState, y: u256) -> u256 {
            if y > 3 {
                let mut z = y;
                let mut x = y / 2 + 1;
                while x < z {
                    z = x;
                    x = (y / x + x) / 2;
                }
                z
            } else if y != 0 {
                1
            } else {
                0
            }
        }

        fn _min(self: @ContractState, a: u256, b: u256) -> u256 {
            if a < b {
                a
            } else {
                b
            }
        }
    }
}
