#!/usr/bin/env bash
set -e
already_generated=false

# This script is meant to only be called via the Makefile not independently.
function generate_jwt_keys() {
	openssl genrsa -out /tmp/private.key 2048 &>/dev/null
	openssl rsa -pubout -in /tmp/private.key -out /tmp/public.key &>/dev/null
}

function random_secret() {
	local characters=${1}
	local size=${2}
	local name=${3}
	tr -dc "${characters}" </dev/urandom | head -c "${size}" >/secrets/live/"${name}"
}

function main() {
	echo -e "\nGenerating JWT Secrets\n-----------------------------------\n"
	today=$(date +"%Y-%m-%d")
	if [ "$already_generated" = true ]; then
		echo -e "\n\tJWT keys already generated. Skipping.\n\n"
		exit 0
	fi
	echo "Backing up the old ones"
	if [ -f secrets/live/JWT_PUBLIC_KEY_$today ]; then
		echo "Backups already exists. Skipping."
	else
		mv secrets/live/JWT_PUBLIC_KEY secrets/live/JWT_PUBLIC_KEY_$today
		mv secrets/live/JWT_PRIVATE_KEY secrets/live/JWT_PRIVATE_KEY_$today
		mv secrets/live/JWT_ADMIN_TOKEN secrets/live/JWT_ADMIN_TOKEN_$today
		echo "Moved the old ones to secrets/live/JWT_ADMIN_TOKEN_$today, secrets/live/JWT_PUBLIC_KEY_$today, and secrets/live/JWT_PRIVATE_KEY_$today"
	fi
	echo -e "\tdone.\n"
	echo "Generating JWT token, public and private keys"
	echo "- generating token"
	random_secret 'A-Za-z0-9' 64 JWT_ADMIN_TOKEN
	echo -e "\tdone.\n"
	echo "- generating keys"
	generate_jwt_keys
	echo -e "\tdone.\n"

	echo "Moving the keys to the secrets/ directory"
	mv /tmp/private.key secrets/live/JWT_PRIVATE_KEY
	mv /tmp/public.key secrets/live/JWT_PUBLIC_KEY
	echo -e "\tdone.\n"

	echo "Setting permissions for the JWT keys"
	chmod 600 /secrets/live/*
	echo -e "\tdone.\n"

}

function check_key_validity() {
    if [ -f secrets/live/JWT_PUBLIC_KEY ] && [ -f secrets/live/JWT_PRIVATE_KEY ]; then
        echo "Checking the validity of the JWT keys"

        # Verify the public key
        if ! openssl pkey -pubin -in secrets/live/JWT_PUBLIC_KEY -noout 2>/dev/null; then
            echo "Error: Invalid public key. Generating new keys."
            main
            return
        fi

        # Verify the private key
        if ! openssl pkey -in secrets/live/JWT_PRIVATE_KEY -noout 2>/dev/null; then
            echo "Error: Invalid private key. Generating new keys."
            main
            return
        fi
        
        # If we get here, both keys are valid
        echo -e "\tJWT keys are valid. No action needed.\n"
    else
        echo "JWT keys are missing. Generating new ones."
        main
    fi
	echo -e "\n----------------------------- Done.\n"
}

main
check_key_validity