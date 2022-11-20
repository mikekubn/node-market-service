#! /bin/bash

echo $PAT | docker login ghcr.io --username $USR --password-stdin
docker build -t market-service:0.1.0 .
docker tag market-service:0.1.0 ghcr.io/akcentacz/market-service/market-service:0.1.0
docker push ghcr.io/akcentacz/market-service/market-service:0.1.0
