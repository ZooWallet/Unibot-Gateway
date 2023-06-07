jest.setTimeout(1000000);
import { Ethereum } from '../../../src/chains/ethereum/ethereum';
// import { patchEVMNonceManager } from '../../evm.nonce.mock';
import { Unibot } from '../../../src/connectors/unibot/unibot';
import { patch, unpatch } from '../../services/patch';
import { BigNumber, Wallet } from 'ethers';
import { patchEVMNonceManager } from '../../evm.nonce.mock';

let ethereum: Ethereum;
let unibot: Unibot;
let wallet: Wallet;
const network: string = 'mumbai';
// const network: string = 'arbitrum_one';
const testPair: string = 'WMATIC-DERC20-0_05%';
// const testPair: string = 'USDC-WETH-0_05%';
const patchOpenPositionExec = true;
const patchClosePositionExec = true;

beforeAll(async () => {
  ethereum = Ethereum.getInstance(network);
  await ethereum.init();
  patchEVMNonceManager(ethereum.nonceManager);

  wallet = new Wallet(
    '26a1775f970ee4bd59bbdccf36b7d5c0cc84d99db40ed98a658aae594e89867b', // test account#2
    ethereum.provider
  );

  unibot = Unibot.getInstance('ethereum', network);
  await unibot.init();
});

beforeEach(() => {
  patchEVMNonceManager(ethereum.nonceManager);
});

afterEach(() => {
  unpatch();
});

afterAll(async () => {
  await ethereum.close();
});

const patchOpenPosition = () => {
  patch(unibot, 'estimateBuyTrade', () => {
    return {
      pair: 'WMATIC-DERC20-0_05%',
      price: { type: 'BigNumber', hex: '0x014906' },
      wantAmount: { type: 'BigNumber', hex: '0x09184e72a000' },
      balance: { type: 'BigNumber', hex: '0x95cfb1aa81c13d18' },
      stopLossUpper: { type: 'BigNumber', hex: '0x017016' },
      stopLossLower: { type: 'BigNumber', hex: '0x0121f6' },
      borrowRatioList: [5000, 10000, 15000, 20000],
      tickSpacing: 10,
      positionIds: [],
    };
  });

  patch(unibot, 'openPosition', () => {
    return {
      type: 2,
      chainId: 31337,
      nonce: 73,
      maxPriorityFeePerGas: { type: 'BigNumber', hex: '0x59682f00' },
      maxFeePerGas: { type: 'BigNumber', hex: '0x59682f20' },
      gasPrice: null,
      gasLimit: { type: 'BigNumber', hex: '0x2dc6c0' },
      to: '0xe0911898D30f469A3d471d2f535eB66579641517',
      value: { type: 'BigNumber', hex: '0x00' },
      data: '0x98a161a5000000000000000000000000000000000000000000000000000009184e72a0000000000000000000000000000000000000000000000000000000000000001388000000000000000000000000000000000000000000000000000000000001490600000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001701600000000000000000000000000000000000000000000000000000000000121f600000000000000000000000000000000000000000000000000000000000005dc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
      accessList: [],
      hash: '0x643d7d21851aeb4afe84addbc88d883badc2fe6cadc61c8992fc45c61585cd47',
      v: 0,
      r: '0xb6a0cc068fd1a78598b89145e39e633068e7aed45e419f2978d4cf807073f4f1',
      s: '0x3d964b728f6b64c0c4ab848d84687630905f7857418d2f76911882f0124c771e',
      from: '0xee4B8E2ACAA9bA8D72E9c5DeCc0F8A7c44213217',
      confirmations: 0,
    };
  });
};

const patchClosePosition = () => {
  patch(unibot, 'estimateSellTrade', () => {
    return {
      pair: 'WMATIC-DERC20-0_05%',
      price: { type: 'BigNumber', hex: '0x014906' },
      positionIds: [{ type: 'BigNumber', hex: '0xd887' }],
      balance: { type: 'BigNumber', hex: '0x95cfa892c859018c' },
      defaultProof: [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
    };
  });
  patch(unibot, 'closePosition', () => {
    return {
      type: 2,
      chainId: 31337,
      nonce: 76,
      maxPriorityFeePerGas: { type: 'BigNumber', hex: '0x59682f00' },
      maxFeePerGas: { type: 'BigNumber', hex: '0x59682f00' },
      gasPrice: null,
      gasLimit: { type: 'BigNumber', hex: '0x2dc6c0' },
      to: '0xe0911898D30f469A3d471d2f535eB66579641517',
      value: { type: 'BigNumber', hex: '0x00' },
      data: '0x25fd2881000000000000000000000000000000000000000000000000000000000000d887000000000000000000000000000000000000000000000000000000000001490600000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
      accessList: [],
      hash: '0xa838f0acf09d7dc1ed6b342fec384f8d50892587b177f543b2ef61829d48510f',
      v: 0,
      r: '0x04342ab7041e4ceb995e6fe1f0c278328f3ca9cbcc930ed489d13c8753da1f27',
      s: '0x00cae6cf9c912469c09b44808afce8b9a6bf8a8f199f08b4c289c52bb1d9b02b',
      from: '0xee4B8E2ACAA9bA8D72E9c5DeCc0F8A7c44213217',
      confirmations: 0,
    };
  });
};

describe('test with unibot suite', () => {
  it('test get current price', async () => {
    const currentPrice = await unibot.getLatestPrice(testPair);
    expect(currentPrice).toEqual(expect.any(Number));
  });
  it('test get position id', async () => {
    try {
      const positionId = await unibot.getPositions(
        testPair,
        '0xee4B8E2ACAA9bA8D72E9c5DeCc0F8A7c44213217',
        BigInt('0')
      );
      expect(positionId.toNumber()).toEqual(expect.any(Number));
    } catch (e) {
      let message;
      if (e instanceof Error) message = e.message;
      else message = String(e);
      expect(message).toContain('revert data');
    }
  });
  it('estimate buy & open position', async () => {
    const openAmount = BigNumber.from('10000000000000');
    const result = await unibot.estimateBuyTrade(
      wallet,
      testPair,
      openAmount,
      BigNumber.from('10')
    );
    console.log(
      `[estimate buy & open position] result: ${JSON.stringify(result)}`
    );
    expect(result['tickSpacing']).toEqual(10);

    // test open position
    if (patchOpenPositionExec) {
      patchOpenPosition();
    }
    const tickRange = BigNumber.from(1500);
    const openResult = await unibot.openPosition(
      wallet,
      testPair,
      openAmount,
      BigNumber.from(5000),
      result['price'],
      BigNumber.from(200),
      BigNumber.from(0),
      result['stopLossUpper'],
      result['stopLossLower'],
      tickRange,
      []
    );
    console.log(`openResult: ${JSON.stringify(openResult)}`);
  });
  it('estimate sell & close position', async () => {
    if (patchClosePositionExec) {
      patchClosePosition();
    }
    // test estimateSellTrade
    const result2 = await unibot.estimateSellTrade(wallet, testPair);
    console.log(
      `[estimate sell & close position] result2: ${JSON.stringify(result2)}`
    );
    if (result2['positionIds'].length > 0) {
      console.log(
        `result2['positionIds']: ${JSON.stringify(result2['positionIds'])}`
      );
      const closeResult = await unibot.closePosition(
        wallet,
        testPair,
        result2['positionIds'][0],
        result2['price'],
        BigNumber.from(200),
        []
      );
      console.log(`closeResult: ${JSON.stringify(closeResult)}`);
    }
  });
});
