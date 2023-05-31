import { Ethereum } from '../../chains/ethereum/ethereum';
import { Unibot } from '../../connectors/unibot/unibot';

let unibot: Unibot;

const exec = async () => {
  const ethereum: Ethereum = Ethereum.getInstance('arbitrum_one');
  await ethereum.init();
  console.log('@@@@');
  console.log(await ethereum.provider._ready());
  console.log('@@@@2');

  unibot = Unibot.getInstance('ethereum', 'arbitrum_one');
  await unibot.init();
};

exec();
