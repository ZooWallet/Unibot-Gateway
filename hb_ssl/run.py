import sys, os, logging
from ssl_cert import create_self_sign_certs

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

passphrase = os.getenv("HB_PASSPHRASE")
cert_path = './certs'

if passphrase != None and len(passphrase) > 0:
    create_self_sign_certs(passphrase, cert_path)
    logging.info('certificate generated!!')
else:
    logging.error('passphrase required!!')
    sys.exit(1)

