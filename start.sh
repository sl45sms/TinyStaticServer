#!/bin/bash
cd server
while true; do
node tiny.js
echo "server crash!"
sleep 1
done
