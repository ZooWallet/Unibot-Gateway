# Unibot Gateway

## Required

* [docker](https://docs.docker.com/engine/install/)
* [docker-compose](https://docs.docker.com/compose/install/)
* python3.8


### Generate certificates

```
pip install cryptography
cd hb_ssl
# please change HB_PASSPHRASE, which you want
HB_PASSPHRASE=unibot python3 run.py

# ls hb_ssl/certs
# ica_cert.pem     ca_key.pem      client_cert.pem client_csr.pem  client_key.pem  server_cert.pem server_csr.pem  server_key.pem
```

### Run Gateway from source

Dependencies:
* NodeJS (16.0.0 or higher)
* Yarn: run `npm install -g yarn` after installing NodeJS

```bash
# Install dependencies
yarn

# Complile Typescript into JS
$ yarn build

# Run Gateway setup script, which helps you set configs and CERTS_PATH
$ chmod a+x gateway-setup.sh
$ ./gateway-setup.sh

# Start the Gateway server using PASSPHRASE
$ yarn start --passphrase=<PASSPHRASE>
```

### Run Gateway using Docker

Dependencies:
* [Docker](https://docker.com)

See the [`/docker`](./docker) folder for Docker installation scripts and instructions on how to use them.

* please change GATEWAY_PASSPHRASE of docker-compose.yml, same as previously set with HB_PASSPHRASE

```
docker-compose up -d

# check server status
docker logs -f gateway_unibot-gateway_1
# secp256k1 unavailable, reverting to browser version
# 2023-06-21 10:31:38 | info | 	⚡️ Starting Gateway API on port 15888...
# 2023-06-21 10:31:38 | info | 	The gateway server is secured behind HTTPS.
# 2023-06-21 10:31:38 | info | 	⚡️ Swagger listening on port 8080. Read the Gateway API documentation at 127.0.0.1:8080
```


## Add Address to wallet
```
cd pybot
python import_eth_account.py $eth_private_key

## Example ##
# python import_eth_account.py 0000000000000000000000000000000000000000000000000000000000000001
# [INFO] 2023-06-21 17:15:23 - request_url: https://localhost:15888/wallet/add
# [INFO] 2023-06-21 17:15:25 - import_eth_account: 200 OK
# [INFO] 2023-06-21 17:15:25 - resp: {'address': '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf'}
```

## Run a basic strategies
* please change address which you just imported into gateway `pybot/config/account.py`
* change unibot pair `pybot/config/market.py`
* change strategies variables `pybot/config/strategies_vars.py`

```
python basic_strategy.py
# > [INFO] 2023-06-21 17:20:22 - estimate_buy: 200 OK
```
