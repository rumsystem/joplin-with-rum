import { ImportExportResult } from './types';

import InteropService_Importer_Base from './InteropService_Importer_Base';
import Folder from '../../models/Folder';
const { filename } = require('../../path-utils');

export default class InteropService_Importer_EnexToMd extends InteropService_Importer_Base {
	async exec(result: ImportExportResult) {
		const { importEnex } = require('../../import-enex');

		let folder = this.options_.destinationFolder;

		if (!folder) {
			const folderTitle = await Folder.findUniqueItemTitle(filename(this.sourcePath_));
			folder = await Folder.save({ title: folderTitle });
		}

		await importEnex(folder.id, this.sourcePath_, this.options_);

		return result;
	}
}
