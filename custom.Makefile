# To write custom Makefile commands and have them show up under `make help`.
#
#  .PHONY: function_name
#  .SILENT: function_name
#  ## JHU: Updates codebase folder to be owned by the host user and nginx group.
#  function_name:
#  ⟼ Tab (not space characters) and each line is executed as part of this function.
#
DOCKCOMPOSE_FILE = $(CURDIR)/docker-compose.yml
ifneq ("$(wildcard $(DOCKCOMPOSE_FILE))","")
    DF_FILE_EXISTS = 1
else
    DF_FILE_EXISTS = 0
endif

.PHONY: jhu_generate-secrets
.SILENT: jhu_generate-secrets
jhu_generate-secrets: QUOTED_CURDIR = "$(CURDIR)"
jhu_generate-secrets:
	@echo ""
	cp -r secrets/template/* secrets/live
	@echo " jhu_generate-secrets └─ Done"
	@echo ""

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
jhu_up: jhu_generate-secrets generate-secrets
	@echo ""
	if [ $(DF_FILE_EXISTS) -eq 1 ]; then \
		echo "docker-compose.yml already exists, skipping starter site creation"; \
		docker-compose up -d --remove-orphans ; \
		echo "  └─ Done"; \
		echo ""; \
		echo " Forcing an exit to prevent running creation steps again."; \
		echo ""; \
	fi
	@echo "docker-compose.yml does not exist, creating starter site"
	$(MAKE) starter-init ENVIRONMENT=starter_dev
	if [ -z "$$(ls -A $(QUOTED_CURDIR)/codebase)" ]; then \
		echo "codebase/ directory is empty, cloning it"; \
		docker container run --rm -v $(CURDIR)/codebase:/home/root $(REPOSITORY)/nginx:$(TAG) with-contenv bash -lc 'git clone -b main https://github.com/jhu-idc/idc-codebase /tmp/codebase; mv /tmp/codebase/* /home/root;'; \
		$(MAKE) set-codebase-owner; \
	fi
	-cp scripts/services.yml codebase/web/sites/default/services.yml
	$(MAKE) set-files-owner SRC=$(CURDIR)/codebase ENVIRONMENT=starter_dev
	docker-compose up -d --remove-orphans
	docker-compose exec -T drupal with-contenv bash -lc 'composer install'
	$(MAKE) set-codebase-owner
	$(MAKE) jhu_starter-finalize ENVIRONMENT=starter_dev

.PHONY: jhu_demo_content
#.SILENT: jhu_demo_content
## JHU: Helper function for demo sites: do a workbench import of sample objects
jhu_demo_content: QUOTED_CURDIR = "$(CURDIR)"
jhu_demo_content: 
	# fetch repo that has csv and binaries to data/samples
	# if prod do this by default
	-docker-compose exec -T drupal with-contenv bash -lc "composer require mjordan/islandora_workbench_integration"
	-docker-compose exec -T drupal with-contenv bash -lc "drush en -y islandora_workbench_integration"
	# if [ -d "islandora_workbench" ]; then rm -rf islandora_workbench; fi
	[ -d "islandora_workbench" ] || (git clone -b new_staging --single-branch https://github.com/DonRichards/islandora_workbench)
	# Just in case your shell autmomatically CDs into the cloned directory like mine does
	if [ ! $(CURDIR) = $(shell pwd) ]; then cd $(CURDIR) ; fi
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
	@echo "**DANGER** About to rm your SERVER data subdirs, your docker volumes, islandora_workbench, certs, secrets, codebase/, and all untracked/ignored files (including .env)."
	$(MAKE) confirm
	-docker-compose down -v --remove-orphans
	sudo rm -fr islandora_workbench certs secrets/live/* docker-compose.yml codebase
	# -git clean -xffd .
	# -git checkout .
	@echo "Codebase/ was completely removed."
	@echo "  └─ Done"

.PHONY: jhu_reset
.SILENT: jhu_reset
## JHU: Destroys all local data, docker volumes, and untracked/ignored files.
jhu_reset:
	@echo "**DANGER** About to rm your SERVER data subdirs, your docker volumes, islandora_workbench, certs, secrets, and all untracked/ignored files (including .env)."
	$(MAKE) confirm
	-docker-compose down -v --remove-orphans
	sudo rm -fr islandora_workbench certs secrets/live/* docker-compose.yml
	@echo "Codebase/ was completely removed."
	@echo "  └─ Done"

.PHONY: jhu_down
.SILENT: jhu_down
## JHU: Brings the local site down without destroying data.
jhu_down:
	-docker-compose down

.PHONY: jhu_config_export
.SILENT: jhu_config_export
## JHU: Exports the sites configuration.
jhu_config_export:
	docker-compose exec drupal with-contenv bash -lc "chown -R nginx: /var/www/drupal/config/sync/"
	docker-compose exec -T drupal drush -l $(SITE) config:export -y
	$(MAKE) set-codebase-owner

.PHONY: jhu_config_import
.SILENT: jhu_config_import
## JHU: Imports the sites configuration.
jhu_config_import:
	$(MAKE) set-codebase-owner
	docker-compose exec drupal with-contenv bash -lc "composer install"
	docker-compose exec drupal with-contenv bash -lc "chown -R nginx: /var/www/drupal/config/sync/"
	docker-compose exec -T drupal drush -l $(SITE) config:import -y --debug
	$(MAKE) set-codebase-owner

.PHONY: jhu_starter-finalize
jhu_starter-finbalize:
	docker-compose exec -T drupal with-contenv bash -lc 'chown -R nginx:nginx .'
	$(MAKE) drupal-database update-settings-php
	sudo rm codebase/config/sync/matomo.settings.yml
	docker-compose exec -T drupal with-contenv bash -lc "composer remove matomo"
	docker-compose exec -T drupal with-contenv bash -lc "drush si -y --existing-config minimal --account-pass $(shell cat secrets/live/DRUPAL_DEFAULT_ACCOUNT_PASSWORD)"
	docker-compose exec -T drupal with-contenv bash -lc "drush -l $(SITE) user:role:add fedoraadmin admin"
	MIGRATE_IMPORT_USER_OPTION=--userid=1 $(MAKE) hydrate
	docker-compose exec -T drupal with-contenv bash -lc 'drush -l $(SITE) migrate:import --userid=1 islandora_fits_tags'
	$(MAKE) set-codebase-owner
	docker-compose exec -T drupal with-contenv bash -lc 'composer require drupal/migrate_tools ; drush pm:enable -y migrate_tools,idc_default_migration && drush migrate:import idc_default_migration_menu_link_main'
	$(MAKE) jhu_demo_content

.PHONY: jhu_enable_dev_tools
.SILENT: jhu_enable_dev_tools
## JHU: Enables devel and devel_generate modules.
jhu_enable_dev_tools:
	$(MAKE) set-codebase-owner
	docker-compose exec drupal with-contenv bash -lc "echo \"alias drupal='vendor/drupal/console/bin/drupal'\" > ~/.bashrc"
	docker-compose exec drupal with-contenv bash -lc "echo \"alias phpcs='vendor/squizlabs/php_codesniffer/bin/phpcs'\" >> ~/.bashrc"
	# phpcs --config-set installed_paths vendor/slevomat/coding-standard vendor/phpcompatibility/php-compatibility vendor/drupal/coder/coder_sniffer && phpcs --config-set default_standard Drupal
	cp scripts/services.yml codebase/web/sites/default/services.yml
	docker-compose exec drupal with-contenv bash -lc "drush en devel -y && drush cr"

.PHONY: jhu_export_repos
.SILENT: jhu_export_repos
## JHU: This copies the codebase directory and theme directory to a parent directory.
jhu_export_repos:
	$(MAKE) jhu_config_export
	-sudo rsync -avz  --exclude '.git' --exclude '.gitignore' --exclude '.github' codebase/ ../idc-codebase --delete
	-sudo rsync -avz  --exclude '.git' --exclude '.gitignore' --exclude '.github' codebase/web/themes/contrib/idc_ui_theme_boots ../ --delete
	-sudo rsync -avz  --exclude '.git' --exclude '.gitignore' --exclude '.github' codebase/web/modules/contrib/idc_default_migration ../ --delete

.PHONY: jhu_sync_repos
.SILENT: jhu_sync_repos
## JHU: This copies the codebase repo and the theme directory from the parent directory.
jhu_sync_repos:
	$(MAKE) set-codebase-owner
	[ -d "../idc-codebase/" ] && rsync -avz --update --exclude '.git' --exclude '.gitignore' --exclude '.github' ../idc-codebase/ codebase
	[ -d "../idc_ui_theme_boots/" ] && rsync -avz --exclude '.git' --exclude '.gitignore' --exclude '.github' ../idc_ui_theme_boots/ codebase/web/themes/contrib/idc_ui_theme_boots
	[ -d "../idc_default_migration/" ] && rsync -avz --update --exclude '.git' --exclude '.gitignore' --exclude '.github' ../idc_default_migration codebase/web/modules/contrib/idc_default_migration
	$(MAKE) set-codebase-owner
