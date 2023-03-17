#!/usr/bin/env bash

ROOT_DIR='/var/idc-isle-dc/'
cd ${ROOT_DIR} || exit 1

if [ -f /etc/server-type.conf ]; then
	servertypename=$(cat /etc/server-type.conf)
	if [ $servertypename == "test" ]; then
		if [ ! -f /etc/domain.conf ]; then
			echo "File Missing /etc/domain.conf"
			exit 1
		fi

		domainname=$(cat /etc/domain.conf)
		sed -i "s/DOMAIN=.*/DOMAIN=$domainname/g" .env

		if [ ! -f ${ROOT_DIR}certs/privkey.pem.bak ]; then
			echo "Copying ${ROOT_DIR}certs/privkey.pem to ${ROOT_DIR}certs/privkey.pem.bak"
			cp ${ROOT_DIR}certs/privkey.pem ${ROOT_DIR}certs/privkey.pem.bak
		fi
		sudo openssl rsa -in /etc/pki/tls/private/star_mse.jhu.edu.key -text > ${ROOT_DIR}certs/privkey.pem || exit 1

		if [ ! -f ${ROOT_DIR}certs/cert.pem.bak ]; then
			echo "Copying ${ROOT_DIR}certs/cert.pem to ${ROOT_DIR}certs/cert.pem.bak"
			cp ${ROOT_DIR}certs/cert.pem ${ROOT_DIR}certs/cert.pem.bak
		fi
		sudo cp /etc/pki/tls/certs/star_mse.jhu.edu.pem ${ROOT_DIR}certs/cert.pem || exit 1

		docker-compose restart traefik
	fi
fi
