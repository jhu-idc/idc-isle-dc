## To run
```shell
make jhu_up
```

## To stop
Stop without losing data.
```shell
make jhu_down
```

## To stop and reset
Stop and reset without removing codebase directory.
```shell
make jhu_clean
```
## Editing the pages
Pages can be impacted by view modes, twig templates, context, and views.  The following sections describe how to edit each of these parts.

## How to edit frontpage
Parts:
- Twig template: `idc_ui_theme_boots/templates/pages/page--front.html.twig`
- View: 
- View Mode:

## How to edit collections/ page
Parts:
- Twig template: `idc_ui_theme_boots/templates/content/node--view--members.html.twig`
- View: Solr search content (Index Default Solr content index) `admin/structure/views/view/solr_search_content/edit/block_1`
- View Mode: Context > Collection `admin/structure/context/collection`

## How to edit search bar on frontpage
Parts:
- Twig template:
- View:
- View Mode: Solr search content (Index Default Solr content index) `admin/structure/views/view/solr_search_content/edit/page_1`
- Block: `Exposed form: solr_search_content-page_1`

