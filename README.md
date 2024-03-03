https://github.com/dockage/tor-privoxy
docker run --name='tor-privoxy' -d -p 9050:9050 -p 9051:9051 -p 8118:8118 dockage/tor-privoxy:latest

The exposed ports are:

9050: Tor proxy (SOCKS5)
9051: Tor control port
8118: Privoxy (HTTP Proxy)

❯ curl https://check.torproject.org/api/ip
{"IsTor":false,"IP":"103.x.x.x"}%

❯ curl --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip
{"IsTor":true,"IP":"192.42.116.189"}%

❯ curl --proxy 127.0.0.1:8118 https://check.torproject.org/api/ip
{"IsTor":true,"IP":"185.220.100.255"}%
