#!/bin/bash

print_if_same () { while read -r -a arr; do if [ "${arr[0]}" == "${arr[1]}" ]; then echo "${arr[0]}"; fi; done ; }
yes | awk '{print NR}' | factor | IFS=': ' print_if_same