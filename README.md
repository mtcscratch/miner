## The Mattcoin Miner
This miner will use your computational resources for the Mattcoin network in exchange for some
MTC tokens. Once a successful block is mined you will receive a notification telling you the block you mined along with a miners reward. You can verify
that the block was indeed mined by you by using https://mattcoin.now.sh/api/v1/block/block-id-here . This is the only way Mattcoins are created and will
never be manipulated by an admin here at mattcoin.

### How to run it
Change username in the config.json then run


```bash
git clone https://github.com/mtcscratch/miner.git
cd miner
npm install
npm start
```
