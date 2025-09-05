import { useContract } from "@starknet-react/core";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";

export const useBalloonsContract = () => {
  const { targetNetwork } = useTargetNetwork();

  const { contract } = useContract({
    address:
      deployedContracts[targetNetwork.network as keyof typeof deployedContracts]
        ?.Balloons?.address,
    abi: deployedContracts[
      targetNetwork.network as keyof typeof deployedContracts
    ]?.Balloons?.abi,
  });

  return contract;
};

export const useDEXContract = () => {
  const { targetNetwork } = useTargetNetwork();

  const { contract } = useContract({
    address:
      deployedContracts[targetNetwork.network as keyof typeof deployedContracts]
        ?.DEX?.address,
    abi: deployedContracts[
      targetNetwork.network as keyof typeof deployedContracts
    ]?.DEX?.abi,
  });

  return contract;
};

export const useSTRKContract = () => {
  const { targetNetwork } = useTargetNetwork();

  // STRK token address on different networks
  const strkAddresses = {
    devnet:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as `0x${string}`,
    sepolia:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as `0x${string}`,
    mainnet:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as `0x${string}`,
  };

  const { contract } = useContract({
    address: strkAddresses[targetNetwork.network as keyof typeof strkAddresses],
    abi: deployedContracts[
      targetNetwork.network as keyof typeof deployedContracts
    ]?.Balloons?.abi, // Use same ERC20 ABI
  });

  return contract;
};
