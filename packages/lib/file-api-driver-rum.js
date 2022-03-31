const { basicDelta } = require('./file-api');
const Setting = require('./models/Setting').default;
const QuorumServer = require('./QuorumServer').default;

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

	isLocalFile(path) {
		if (/^\.resource.*$/.test(path) || /^\.sync.*$/.test(path) || /^\.lock.*$/.test(path) || /^temp.*$/.test(path)) return true;
		return false;
	}

	localFileFullPath(path) {
		const output = [];
		const syncPath = `${Setting.value('profileDir')}/rumsystemSyncLocalFiles`;
		if (syncPath) output.push(syncPath);
		if (path) output.push(path);
		return output.join('/');
	}

	// mix done
	async stat(path) {
		console.log('stat: ', path);
		console.log('save in local: ', this.isLocalFile(path));
		if (this.isLocalFile(path) || !path) {
			try {
				path = this.localFileFullPath(path);
				const s = await this.fsDriver().stat(path);
				console.log(s);
				if (!s) return null;
				return this.metadataFromStat_(s);
			} catch (error) {
				throw this.fsErrorToJsError_(error);
			}
		} else {
			try {
				const QuorumClient = QuorumServer.instance().client();
				let object = await QuorumClient.Object.get(path);
				console.log(object);
				if (!object) return null;
				return this.remotePrefixPath_(this.metadataFromObject_(object), path);
			} catch (error) {
				console.log(error);
			}
		}
	}

	metadataFromObject_(object) {
		return {
			path: object.Content.id,
			// created_time: ,
			updated_time: Math.floor(object.TimeStamp / 1000000),
			isDir: false,
		};
	}

	remotePrefixPath_(meta, path) {
		const reg = new RegExp('^' + path);
		return {
			path: meta.path.replace(reg, '').replace(/^\//, ''),
			updated_time: meta.updated_time,
			isDir: meta.isDir,
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

	// mix done
	async setTimestamp(path, timestampMs) {
		if (this.isLocalFile(path) || !path) {
			path = this.localFileFullPath(path);
			try {
				await this.fsDriver().setTimestamp(path, new Date(timestampMs));
			} catch (error) {
				throw this.fsErrorToJsError_(error);
			}
		}
		throw new Error('Not implemented'); // Not needed anymore
	}

	// mix done
	async delta(path, options) {
		console.log('delta: ', path);
		console.log('save in local: ', this.isLocalFile(path));

		const getDirStats = async path => {
			const result = await this.list(path);
			return result.items;
		};

		return await basicDelta(path, getDirStats, options);
	}


	// mix done
	async list(path) {
		console.log('list: ', path);
		console.log('save in local: ', this.isLocalFile(path));
		const getFileSystemList = async (path) => {
			try {
				path = this.localFileFullPath(path);
				const stats = await this.fsDriver().readDirStats(path);
				console.log(stats);
				const output = this.metadataFromStats_(stats);
				console.log(output);
				return output;
			} catch (error) {
				throw this.fsErrorToJsError_(error, path);
			}
		}
		const getRumSystemList = async (path) => {
			try {
				const QuorumClient = QuorumServer.instance().client();
				let objects = await QuorumClient.Object.list();
				if (path) {
					const reg = new RegExp('^' + path);
					objects = objects.filter(object => reg.test(object.Content.id));
					console.log(objects);
					objects = objects.map(this.metadataFromObject_).map(object => this.remotePrefixPath_(object, path));
					console.log(objects);
				} else {
					console.log(objects);
					objects = objects.map(this.metadataFromObject_);
					console.log(objects);
				}
				return objects;
			} catch (error) {
				console.log(error);
			}
		}
		let output;
		if (!path) {
			const fileOutput = await getFileSystemList(path);
			const rumOutput = await getRumSystemList(path);
			output = fileOutput.concat(rumOutput);
		} else {
			if (this.isLocalFile(path)) {
				output = await getFileSystemList(path);
			} else {
				output = await getRumSystemList(path);
			}
		}
		return {
			items: output,
			hasMore: false,
			context: null,
		};
	}

	// mix done
	async get(path, options) {
		console.log('get: ', path);
		console.log('save in local: ', this.isLocalFile(path));
		let output = null;
		if (this.isLocalFile(path) || !path) {
			path = this.localFileFullPath(path);
			try {
				if (options.target === 'file') {
					// output = await fs.copy(path, options.path, { overwrite: true });
					output = await this.fsDriver().copy(path, options.path);
				} else {
					// output = await fs.readFile(path, options.encoding);
					output = await this.fsDriver().readFile(path, options.encoding);
				}
				console.log(output);
			} catch (error) {
				if (error.code == 'ENOENT') return null;
				throw this.fsErrorToJsError_(error, path);
			}
		} else {
			try {
				const QuorumClient = QuorumServer.instance().client();
				const object = await QuorumClient.Object.get(path);
				output = object?.Content?.content || null;
				console.log(output);
				if (options.target === 'file') {
				  await this.fsDriver().outputFile(options.path, output, 'utf8');
				}
			} catch (error) {
				console.log(error);
			}
		}
		return output;
	}

	// mix done
	async mkdir(path) {
		console.log('mkdir: ', path);
		if (this.isLocalFile(path) || !path) {
			path = this.localFileFullPath(path);
			if (await this.fsDriver().exists(path)) return;

			try {
				await this.fsDriver().mkdir(path);
			} catch (error) {
				throw this.fsErrorToJsError_(error, path);
			}
		}
		return true;
	}

	// mix done
	async put(path, content, options = null) {
		console.log('put: ', path);
		console.log('save in local: ', this.isLocalFile(path));
		if (!options) options = {};
		if (this.isLocalFile(path) || !path) {
			path = this.localFileFullPath(path);
			try {
				if (options.source === 'file') {
					await this.fsDriver().copy(options.path, path);
					return;
				}

				await this.fsDriver().outputFile(path, content, 'utf8');
			} catch (error) {
				throw this.fsErrorToJsError_(error, path);
			}
		} else {
			const keyPath = path;
			if (options.source === 'file') {
				try {
					const content = await this.fsDriver().readFile(options.path);
					const QuorumClient = QuorumServer.instance().client();
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
				} catch (error) {}
				return;
			}

			try {
				const QuorumClient = QuorumServer.instance().client();
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
			} catch (error) {}
		}
	}

	// mix done
	async delete(path) {
		console.log('delete: ', path);
		console.log('save in local: ', this.isLocalFile(path));
		if (this.isLocalFile(path) || !path) {
			try {
				path = this.localFileFullPath(path);
				await this.fsDriver().unlink(path);
			} catch (error) {
				throw this.fsErrorToJsError_(error, path);
			}
		} else {
			try {
				const QuorumClient = QuorumServer.instance().client();
				await QuorumClient.Object.delete(Setting.value('sync.11.group').group_id, path);
			} catch (error) {
				console.log(error);
			}
		}
	}

	// mix done
	async move(oldPath, newPath) {
		console.log('move from: ', oldPath, ' to: ', newPath);
		if (oldPath === newPath) return;
		try {
			const content = await this.get(oldPath);
			await this.put(newPath, content);
			await this.delete(oldPath);
		} catch(error) {
			console.log(error);
		}
	}

	// mix done
	format() {
		throw new Error('Not supported');
	}

	// mix done
	async clearRoot(baseDir) {
		baseDir = this.localFileFullPath(baseDir);
		console.log('clearRoot: ', baseDir);
		await this.fsDriver().remove(baseDir);
		await this.fsDriver().mkdir(baseDir);
		try {
			const QuorumClient = QuorumServer.instance().client();
			const { group_id } = Setting.value('sync.11.group');
			const objects = await QuorumClient.Object.list();
			console.log(objects);
			objects.forEach(async object => {
				try {
					await QuorumClient.Object.delete(group_id, object.Content.id);
				} catch (error) {
					console.log(error);
				}
			});
		} catch (error) {
		}
	}
}

module.exports = { FileApiDriverRum };
