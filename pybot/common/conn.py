import logging
import http.client
import ssl
from config.certs import key_file, certificate_file, certificate_secret, host


def init_connection():
    logging.debug('init_connection')
    # Define the client certificate settings for https connection
    context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
    context.load_cert_chain(keyfile=key_file, certfile=certificate_file, password=certificate_secret)

    # Create a connection to submit HTTP requests
    connection = http.client.HTTPSConnection(host, port=15888, context=context)
    return connection
