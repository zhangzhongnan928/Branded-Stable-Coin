// Minimal ABIs for the frontend. Kept in sync with src/*.sol.

export const erc20Abi = [
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const

const brandInfoComponents = [
  { name: 'vault', type: 'address' },
  { name: 'token', type: 'address' },
  { name: 'name', type: 'string' },
  { name: 'symbol', type: 'string' },
  { name: 'owner', type: 'address' },
  { name: 'treasury', type: 'address' },
  { name: 'cap', type: 'uint256' },
] as const

export const factoryAbi = [
  { type: 'function', name: 'brandsCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'getBrands', stateMutability: 'view', inputs: [], outputs: [{ type: 'tuple[]', components: brandInfoComponents }] },
  { type: 'function', name: 'getBrandsRange', stateMutability: 'view', inputs: [{ name: 'offset', type: 'uint256' }, { name: 'limit', type: 'uint256' }], outputs: [{ type: 'tuple[]', components: brandInfoComponents }] },
  { type: 'function', name: 'protocolFeeBps', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint16' }] },
  { type: 'function', name: 'protocolFeeRecipient', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  {
    type: 'function', name: 'createBrand', stateMutability: 'nonpayable',
    inputs: [{ name: 'name', type: 'string' }, { name: 'symbol', type: 'string' }, { name: 'treasury', type: 'address' }, { name: 'cap', type: 'uint256' }],
    outputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }],
  },
  {
    type: 'function', name: 'createBrandWithProfile', stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' }, { name: 'symbol', type: 'string' },
      { name: 'treasury', type: 'address' }, { name: 'cap', type: 'uint256' },
      { name: 'logoURI', type: 'string' }, { name: 'description', type: 'string' }, { name: 'benefitsURI', type: 'string' },
    ],
    outputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }],
  },
  {
    type: 'event', name: 'BrandCreated', anonymous: false,
    inputs: [
      { name: 'creator', type: 'address', indexed: true },
      { name: 'vault', type: 'address', indexed: false },
      { name: 'token', type: 'address', indexed: false },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'treasury', type: 'address', indexed: false },
      { name: 'cap', type: 'uint256', indexed: false },
    ],
  },
] as const

export const vaultAbi = [
  // reads
  { type: 'function', name: 'totalPrincipal', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'aBalance', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'availableYield', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'cap', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'treasury', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'brandOwner', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'token', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'aToken', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'paused', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'isSolvent', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'solvencyDeficit', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'logoURI', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'description', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'benefitsURI', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'metadataURI', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  {
    type: 'function', name: 'profile', stateMutability: 'view', inputs: [],
    outputs: [
      { name: 'name_', type: 'string' }, { name: 'symbol_', type: 'string' }, { name: 'token_', type: 'address' },
      { name: 'treasury_', type: 'address' }, { name: 'cap_', type: 'uint256' }, { name: 'totalPrincipal_', type: 'uint256' },
      { name: 'logoURI_', type: 'string' }, { name: 'description_', type: 'string' },
      { name: 'benefitsURI_', type: 'string' }, { name: 'metadataURI_', type: 'string' },
    ],
  },
  // writes — fan
  { type: 'function', name: 'deposit', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'redeem', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  // writes — creator
  { type: 'function', name: 'harvestYield', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'setProfile', stateMutability: 'nonpayable', inputs: [{ name: 'logoURI', type: 'string' }, { name: 'description', type: 'string' }, { name: 'benefitsURI', type: 'string' }], outputs: [] },
  { type: 'function', name: 'setBenefitsURI', stateMutability: 'nonpayable', inputs: [{ name: 'uri', type: 'string' }], outputs: [] },
  { type: 'function', name: 'setCap', stateMutability: 'nonpayable', inputs: [{ name: 'cap', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'setTreasury', stateMutability: 'nonpayable', inputs: [{ name: 'treasury', type: 'address' }], outputs: [] },
  { type: 'function', name: 'pause', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'unpause', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const
