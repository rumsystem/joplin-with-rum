// A service that handle notes and folders in a uniform way

import { BaseService } from 'src/base-service.js';
import { BaseModel } from 'src/base-model.js';
import { Note } from 'src/models/note.js';
import { Folder } from 'src/models/folder.js';
import { Log } from 'src/log.js';
import { Registry } from 'src/registry.js';

class NoteFolderService extends BaseService {

	static save(type, item, oldItem) {
		let diff = null;
		if (oldItem) {
			diff = BaseModel.diffObjects(oldItem, item);
			if (!Object.getOwnPropertyNames(diff).length) {
				Log.info('Item not changed - not saved');
				return Promise.resolve(item);
			}
		}

		let ItemClass = null;
		if (type == 'note') {
			ItemClass = Note;
		} else if (type == 'folder') {
			ItemClass = Folder;
		}

		let isNew = !item.id;
		let output = null;

		let toSave = item;
		if (diff !== null) {
			toSave = diff;
			toSave.id = item.id;
		}

		return ItemClass.save(toSave).then((savedItem) => {
			output = Object.assign(item, savedItem);
			if (isNew && type == 'note') return Note.updateGeolocation(output.id);
		}).then(() => {
//			Registry.synchronizer().start();
			return output;
		});
	}

	// static setField(type, itemId, fieldName, fieldValue, oldValue = undefined) {
	// 	// TODO: not really consistent as the promise will return 'null' while
	// 	// this.save will return the note or folder. Currently not used, and maybe not needed.
	// 	if (oldValue !== undefined && fieldValue === oldValue) return Promise.resolve();

	// 	let item = { id: itemId };
	// 	item[fieldName] = fieldValue;
	// 	let oldItem = { id: itemId };
	// 	return this.save(type, item, oldItem);
	// }

	static openNoteList(folderId) {
		return Note.previews(folderId).then((notes) => {
			this.dispatch({
				type: 'NOTES_UPDATE_ALL',
				notes: notes,
			});

			this.dispatch({
				type: 'Navigation/NAVIGATE',
				routeName: 'Notes',
				folderId: folderId,
			});
		}).catch((error) => {
			Log.warn('Cannot load notes', error);
		});
	}

}

export { NoteFolderService };