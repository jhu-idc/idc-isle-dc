#!/usr/bin/env bash

cd /var/idc-isle-dc/codebase/ || exit 1

if [ -f /etc/server-type.conf ]; then
	if [ $(cat /etc/server-type.conf) == "test" ]; then
		if [ ! -f /var/idc-isle-dc/codebase/certs/privkey.pem.bak ]; then
			cp /var/idc-isle-dc/codebase/certs/privkey.pem /var/idc-isle-dc/codebase/certs/privkey.pem.bak
		fi
		sudo openssl rsa -in /etc/pki/tls/private/star_mse.jhu.edu.key -text /var/idc-isle-dc/codebase/certs/privkey.pem || exit 1
		if [ ! -f /var/idc-isle-dc/codebase/certs/cert.pem.bak ]; then
			cp /var/idc-isle-dc/codebase/certs/cert.pem /var/idc-isle-dc/codebase/certs/cert.pem.bak
		fi
		sudo cp /etc/pki/tls/certs/star_mse.jhu.edu.pem /var/idc-isle-dc/codebase/certs/cert.pem || exit 1

		docker-compose restart traefik
	fi
fi

