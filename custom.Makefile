# To write custom Makefile commands and have them show up under `make help`.
#
#  .PHONY: function_name
#  .SILENT: function_name
#  ## JHU: Updates codebase folder to be owned by the host user and nginx group.
#  function_name:
#  ⟼ Tab (not space characters) and each line is executed as part of this function.
#

.PHONY: set-codebase-owner
.SILENT: set-codebase-owner
## JHU: Updates codebase folder to be owned by the host user and nginx group.
set-codebase-owner:
	@echo ""
	@echo "Setting codebase/ folder owner back to $(shell id -u):101"
	sudo find ./codebase -not -user $(shell id -u) -not -path '*/sites/default/files/*' -exec chown $(shell id -u):101 {} \;
	sudo find ./codebase -not -group 101 -not -path '*/sites/default/files/*' -exec chown $(shell id -u):101 {} \;
	@echo "  └─ Done"
	@echo ""

.PHONY: jhu_up
## JHU: Make a local site with codebase directory bind mounted, using cloned starter site.
jhu_up: QUOTED_CURDIR = "$(CURDIR)"
jhu_up: generate-secrets
	$(MAKE) starter-init ENVIRONMENT=starter_dev
	if [ -z "$$(ls -A $(QUOTED_CURDIR)/codebase)" ]; then \
		docker container run --rm -v $(CURDIR)/codebase:/home/root $(REPOSITORY)/nginx:$(TAG) with-contenv bash -lc 'git clone -b main https://github.com/jhu-idc/idc-codebase /tmp/codebase; mv /tmp/codebase/* /home/root;'; \
	fi
	$(MAKE) set-files-owner SRC=$(CURDIR)/codebase ENVIRONMENT=starter_dev
	docker-compose up -d --remove-orphans
	docker-compose exec -T drupal with-contenv bash -lc 'composer install'
	$(MAKE) starter-finalize ENVIRONMENT=starter_dev
	$(MAKE) set-codebase-owner
	# docker-compose exec drupal with-contenv bash -lc "echo \"alias drupal='vendor/drupal/console/bin/drupal'\" > ~/.bashrc"
	$(MAKE) jhu_demo_content

.PHONY: jhu_demo_content
#.SILENT: jhu_demo_content
## JHU: Helper function for demo sites: do a workbench import of sample objects
jhu_demo_content:
	# fetch repo that has csv and binaries to data/samples
	# if prod do this by default
	-docker-compose exec -T drupal with-contenv bash -lc "composer require mjordan/islandora_workbench_integration"
	-docker-compose exec -T drupal with-contenv bash -lc "drush en -y islandora_workbench_integration"
	# if [ -d "islandora_workbench" ]; then rm -rf islandora_workbench; fi
	[ -d "islandora_workbench" ] || (git clone -b new_staging --single-branch https://github.com/DonRichards/islandora_workbench)
	$(SED_DASH_I) 's/^nopassword.*/password\: $(shell cat secrets/live/DRUPAL_DEFAULT_ACCOUNT_PASSWORD) /g' islandora_workbench/demoBDcreate*
	$(SED_DASH_I) 's/http:/https:/g' islandora_workbench/demoBDcreate*
	$(SED_DASH_I) 's/author_email\="mjordan@sfu"\,$$/author_email="mjordan@sfu", packages=["i7Import", "i8demo_BD", "input_data"],/g' islandora_workbench/setup.py
	cd islandora_workbench && docker build -t workbench-docker .
	cd islandora_workbench && docker run -it --rm --network="host" -v $(shell pwd)/islandora_workbench:/workbench --name my-running-workbench workbench-docker bash -lc "(cd /workbench && python setup.py install 2>&1 && ./workbench --config demoBDcreate_all_localhost.yml)"
	$(MAKE) reindex-solr

.PHONY: jhu_clean
.SILENT: jhu_clean
## JHU: Destroys all local data, including codebase, docker volumes, and untracked/ignored files.
jhu_clean:
	@echo "**DANGER** About to rm your SERVER data subdirs, your docker volumes, islandora_workbench, certs, secrets, and all untracked/ignored files (including .env)."
	$(MAKE) confirm
	-docker-compose down -v
	sudo rm -fr islandora_workbench certs secrets/live/* docker-compose.yml codebase
	@echo "Codebase/ was not reset."
	@echo "  └─ Done"

.PHONY: jhu_down
.SILENT: jhu_down
## JHU: Brings the local site down without destroying data.
jhu_down:
	-docker-compose down