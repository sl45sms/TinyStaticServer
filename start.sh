#!/bin/bash
cd server
echo $1
while true; do
node tiny.js  10631 $1 $2
echo "server crash!"
sleep 1
done
