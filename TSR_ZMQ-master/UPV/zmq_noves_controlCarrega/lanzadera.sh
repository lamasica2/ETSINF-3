#!/bin/bash 
number=1
while [ $number -lt $1 ]; do
 echo "ZeroMQ != $number MQ"
    number=$((number + 1))
  done
 echo "ZeroMQ == 0MQ" 