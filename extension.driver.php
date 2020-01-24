<?php

	class extension_publish_tabs extends Extension {

		public function uninstall() {
			return Symphony::Database()
				->drop('tbl_fields_publish_tabs')
				->ifExists()
				->execute()
				->success();
		}

		public function install() {
			return Symphony::Database()
				->create('tbl_fields_publish_tabs')
				->ifNotExists()
				->fields([
					'id' => [
						'type' => 'int(11)',
						'auto' => true,
					],
					'field_id' => 'int(11)',
				])
				->keys([
					'id' => 'primary',
				])
				->execute()
				->success();
		}

		public function getSubscribedDelegates() {
			return array(
				array(
					'page'		=> '/backend/',
					'delegate'	=> 'InitaliseAdminPageHead',
					'callback'	=> 'initializeAdmin'
				),
			);
		}

		public function initializeAdmin($context) {
			$page = Administration::instance()->Page;
			$context = $page->getContext();

			$callback = Administration::instance()->getPageCallback();

			// only proceed on New or Edit publish pages
			if ($page instanceof contentPublish and in_array($context['page'], array('new', 'edit'))) {

				$page->addStylesheetToBody(URL . '/extensions/publish_tabs/assets/publish_tabs.publish.css', 'screen', 1);
				$page->addScriptToBody(URL . '/extensions/publish_tabs/assets/publish_tabs.publish.js', 1);

				include_once(TOOLKIT . '/class.sectionmanager.php');

				$section_id = SectionManager::fetchIDFromHandle($callback['context']['section_handle']);
				$section = (new SectionManager)
					->select()
					->section($section_id)
					->execute()
					->next();

				if( !$section instanceof Section ) return;

				$tabs = array();
				$current_tab = '';
				$index = -1;

				foreach($section->fetchFieldsSchema() as $i => $field) {
					if ($i == 0 && $field['type'] != 'publish_tabs'){
						$current_tab = 'untitled-tab';
						$tabs[++$index]['tab_id'] = $current_tab;
					}
					if ($field['type'] == 'publish_tabs') {
						$current_tab = $field['id'];
						$tabs[++$index]['tab_id'] = $current_tab;
					} else {
						$tabs[$index][$field['location']][] = 'field-' . $field['id'];
					}
				}

				$page->addElementToHead(new XMLElement(
					'script',
					"Symphony.Context.add('publish-tabs', " . json_encode($tabs) . ")",
					array('type' => 'text/javascript')
				), 9003);
			}

		}

	}
