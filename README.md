# ransomware site scraper

Scrapes data from ransomware sites and stores parsed data in a JSON file for futher data analysis.

Supported ransomware sites:

- 8base
- lockbit
- play

## Getting Started

Pre-requisites:

- Node.js
- Docker (or Tor HTTP proxy)

### Setup Tor proxy

You need to have Tor setup, we use [`tor-privoxy`](https://github.com/dockage/tor-privoxy) docker image. It runs a Tor proxy with Privoxy HTTP proxy.

```bash
docker run --name='tor-privoxy' -d -p 9050:9050 -p 9051:9051 -p 8118:8118 dockage/tor-privoxy:latest

❯ curl https://check.torproject.org/api/ip
{"IsTor":false,"IP":"103.x.x.x"}%

❯ curl --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip
{"IsTor":true,"IP":"192.42.116.189"}%

❯ curl --proxy 127.0.0.1:8118 https://check.torproject.org/api/ip
{"IsTor":true,"IP":"185.220.100.255"}%
```

The exposed ports are:

- 9050: Tor proxy (SOCKS5)
- 9051: Tor control port
- 8118: Privoxy (HTTP Proxy)

### Install dependencies

Preferably use `pnpm` to install dependencies.

```bash
pnpm install
```

### Run the scraper

Update `src/main.ts` to the updated site domain names. If you are running the Tor proxy on a different port, or address update the `ProxyAgent` configuration in `src/crawler.ts`, we use HTTP proxy for the requests.

```bash
pnpm start
```

Parsed output is stored in `./tmp/parsed` directory. Webpages are cached in `./tmp/pages`.
