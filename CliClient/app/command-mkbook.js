import { BaseCommand } from './base-command.js';
import { app } from './app.js';
import { _ } from 'lib/locale.js';
import { Folder } from 'lib/models/folder.js';

class Command extends BaseCommand {

	usage() {
		return 'mkbook <notebook>';
	}

	description() {
		return 'Creates a new notebook.';
	}

	aliases() {
		return ['mkdir'];
	}

	async action(args) {
		let folder = await Folder.save({ title: args['notebook'] }, {
			duplicateCheck: true,
			reservedTitleCheck: true,
		});
		
		app().switchCurrentFolder(folder);
	}

}

module.exports = Command;