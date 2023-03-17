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
			cp ${ROOT_DIR}certs/privkey.pem ${ROOT_DIR}certs/privkey.pem.bak || exit 1
		fi
		sudo openssl rsa -in /etc/pki/tls/private/star_mse.jhu.edu.key -text > ${ROOT_DIR}certs/privkey.pem || exit 1

		if [ ! -f ${ROOT_DIR}certs/cert.pem.bak ]; then
			echo "Copying ${ROOT_DIR}certs/cert.pem to ${ROOT_DIR}certs/cert.pem.bak"
			cp ${ROOT_DIR}certs/cert.pem ${ROOT_DIR}certs/cert.pem.bak || exit 1
		fi
		sudo cp /etc/pki/tls/certs/star_mse.jhu.edu.pem ${ROOT_DIR}certs/cert.pem || exit 1

		docker-compose restart traefik || exit 1
	fi

	# Check if the URL is up and has a valid SSL certificate
	url = "https://$domainname"
	if curl --output /dev/null --silent --head --fail "$url" ; then
		echo "Looks like the URL is up and has a valid SSL certificate"
	else
		echo "Warning: URL is not available or has an invalid SSL certificate"
		echo "Rolling back to the backup certs"
		if [ -f ${ROOT_DIR}certs/privkey.pem.bak ]; then
			mv ${ROOT_DIR}certs/privkey.pem.bak ${ROOT_DIR}certs/privkey.pem
		fi
		if [ -f ${ROOT_DIR}certs/cert.pem.bak ]; then
			mv ${ROOT_DIR}certs/cert.pem.bak ${ROOT_DIR}certs/cert.pem
		fi

		docker-compose restart traefik || exit 1
	fi
fi
