const { basicDelta } = require('./file-api');
const Setting = require('./models/Setting').default;
const QuorumSDK = require('quorum-sdk-electron-renderer').default;
const QuorumClient = new QuorumSDK();

class FileApiDriverRum {
	fsErrorToJsError_(error, path = null) {
		let msg = error.toString();
		if (path !== null) msg += `. Path: ${path}`;
		const output = new Error(msg);
		if (error.code) output.code = error.code;
		return output;
	}

	fsDriver() {
		if (!FileApiDriverRum.fsDriver_) throw new Error('FileApiDriverRum.fsDriver_ not set!');
		return FileApiDriverRum.fsDriver_;
	}

	isTempFile(path) {
		if (/^\.resource.*$/.test(path) || /^\.sync.*$/.test(path) || /^\.lock.*$/.test(path) || /^temp.*$/.test(path) || /^locks.*$/.test(path)) return true;
		return false;
	}

	tempFileFullPath(path) {
		const output = [];
		const syncPath = Setting.value('sync.11.path');
		if (syncPath) output.push(syncPath);
		if (path) output.push(path);
		return output.join('/');
	}

	async stat(path) {
    console.log('test stat');
		console.log(path);
		console.log(this.isTempFile(path));
		path = this.tempFileFullPath(path);
		try {
			const s = await QuorumClient.Object.get(path);
      console.log(s);
		} catch (error) {
			console.log(error);
		}
		try {
			const s = await this.fsDriver().stat(path);
      console.log(s);
			if (!s) return null;
			return this.metadataFromStat_(s);
		} catch (error) {
			throw this.fsErrorToJsError_(error);
		}
	}

	metadataFromStat_(stat) {
		return {
			path: stat.path,
			// created_time: stat.birthtime.getTime(),
			updated_time: stat.mtime.getTime(),
			isDir: stat.isDirectory(),
		};
	}

	metadataFromStats_(stats) {
		const output = [];
		for (let i = 0; i < stats.length; i++) {
			const mdStat = this.metadataFromStat_(stats[i]);
			output.push(mdStat);
		}
		return output;
	}

	async setTimestamp(path, timestampMs) {
		path = this.tempFileFullPath(path);
		try {
			await this.fsDriver().setTimestamp(path, new Date(timestampMs));
		} catch (error) {
			throw this.fsErrorToJsError_(error);
		}
	}

	async delta(path, options) {
		console.log('test delta');
		console.log(path);
		console.log(this.isTempFile(path));
		path = this.tempFileFullPath(path);
		try {
			const stats = await QuorumClient.Object.list();
			console.log(stats);
		} catch (error) {
		}
		const getStatFn = async path => {
			const stats = await this.fsDriver().readDirStats(path);
			return this.metadataFromStats_(stats);
		};

		try {
			const output = await basicDelta(path, getStatFn, options);
			return output;
		} catch (error) {
			throw this.fsErrorToJsError_(error, path);
		}
	}

	async list(path) {
		console.log('test list');
		console.log(path);
		console.log(this.isTempFile(path));
		path = this.tempFileFullPath(path);
		try {
			const stats = await QuorumClient.Object.list();
			console.log(stats);
		} catch (error) {
		}
		try {
			const stats = await this.fsDriver().readDirStats(path);
			console.log(stats);
			const output = this.metadataFromStats_(stats);

			return {
				items: output,
				hasMore: false,
				context: null,
			};
		} catch (error) {
			throw this.fsErrorToJsError_(error, path);
		}
	}

	async get(path, options) {
		console.log('test get');
		console.log(path);
		console.log(this.isTempFile(path));
		path = this.tempFileFullPath(path);
		try {
			const stats = await QuorumClient.Object.get(path);
			console.log(stats);
		} catch (error) {
		}

		let output = null;

		try {
			if (options.target === 'file') {
				// output = await fs.copy(path, options.path, { overwrite: true });
				output = await this.fsDriver().copy(path, options.path);
			} else {
				// output = await fs.readFile(path, options.encoding);
				output = await this.fsDriver().readFile(path, options.encoding);
			}
		} catch (error) {
			if (error.code == 'ENOENT') return null;
			throw this.fsErrorToJsError_(error, path);
		}

		return output;
	}

	async mkdir(path) {
		path = this.tempFileFullPath(path);
		if (await this.fsDriver().exists(path)) return;

		try {
			await this.fsDriver().mkdir(path);
		} catch (error) {
			throw this.fsErrorToJsError_(error, path);
		}

		// return new Promise((resolve, reject) => {
		// 	fs.exists(path, (exists) => {
		// 		if (exists) {
		// 			resolve();
		// 			return;
		// 		}

		// 		fs.mkdirp(path, (error) => {
		// 			if (error) {
		// 				reject(this.fsErrorToJsError_(error));
		// 			} else {
		// 				resolve();
		// 			}
		// 		});
		// 	});
		// });
	}

	async put(path, content, options = null) {
		console.log('test put');
		console.log(path);
		console.log(this.isTempFile(path));
		const keyPath = path;
		path = this.tempFileFullPath(path);
		if (!options) options = {};

		try {
			if (options.source === 'file') {
				await this.fsDriver().copy(options.path, path);
				return;
			}

			console.log(content);
			await this.fsDriver().writeFile(path, content, 'utf8');
			try {
				const group = Setting.value('sync.11.group');
				const object = await QuorumClient.Object.put(group.user_pubkey, {
					type: 'Add',
					object: {
						id: keyPath,
						type: 'Note',
						content: content,
					},
					target: {
						id: group.group_id,
						type: 'Group',
					},
				});
				console.log(object);
			} catch (error) {
			}
		} catch (error) {
			throw this.fsErrorToJsError_(error, path);
		}

		// if (!options) options = {};

		// if (options.source === 'file') content = await fs.readFile(options.path);

		// return new Promise((resolve, reject) => {
		// 	fs.writeFile(path, content, function(error) {
		// 		if (error) {
		// 			reject(this.fsErrorToJsError_(error));
		// 		} else {
		// 			resolve();
		// 		}
		// 	});
		// });
	}

	async delete(path) {
		console.log('test delete');
		console.log(path);
		console.log(this.isTempFile(path));
		try {
			await QuorumClient.Object.delete(Setting.value('sync.11.group_id'), path);
		} catch (error) {
		}
		try {
			await this.fsDriver().unlink(path);
		} catch (error) {
			throw this.fsErrorToJsError_(error, path);
		}
	}

	async move(oldPath, newPath) {
		oldPath = this.tempFileFullPath(oldPath);
		newPath = this.tempFileFullPath(newPath);
		try {
			await this.fsDriver().move(oldPath, newPath);
		} catch (error) {
			throw this.fsErrorToJsError_(error, oldPath);
		}

		// let lastError = null;

		// for (let i = 0; i < 5; i++) {
		// 	try {
		// 		let output = await fs.move(oldPath, newPath, { overwrite: true });
		// 		return output;
		// 	} catch (error) {
		// 		lastError = error;
		// 		// Normally cannot happen with the `overwrite` flag but sometime it still does.
		// 		// In this case, retry.
		// 		if (error.code == 'EEXIST') {
		// 			await time.sleep(1);
		// 			continue;
		// 		}
		// 		throw this.fsErrorToJsError_(error);
		// 	}
		// }

		// throw lastError;
	}

	format() {
		throw new Error('Not supported');
	}

	async clearRoot(baseDir) {
		baseDir = this.tempFileFullPath(baseDir);
		await this.fsDriver().remove(baseDir);
		await this.fsDriver().mkdir(baseDir);
	}
}

module.exports = { FileApiDriverRum };
