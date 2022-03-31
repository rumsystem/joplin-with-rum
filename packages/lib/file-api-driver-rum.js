const { basicDelta } = require('./file-api');
const Setting = require('./models/Setting').default;

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
		if (/^\.resource.*$/.test(path) || /^\.sync.*$/.test(path) || /^\.lock.*$/.test(path) || /^temp.*$/.test(path) || /^locks.*$/.test(path)) return true;
		return false;
	}

	localFileFullPath(path) {
		const output = [];
		const syncPath = Setting.value('sync.11.path');
		if (syncPath) output.push(syncPath);
		if (path) output.push(path);
		return output.join('/');
	}

	// done
	async stat(path) {
		console.log('test stat');
		console.log(path);
		console.log(this.isLocalFile(path));
		try {
			const QuorumClient = window.QuorumClient;
			let object = await QuorumClient.Object.get(path);
			console.log(object);
			object = this.remotePrefixPath_(this.metadataFromObject_(object), path);
			console.log(object);
		} catch (error) {
			console.log(error);
		}
		try {
		  path = this.localFileFullPath(path);
			const s = await this.fsDriver().stat(path);
			console.log(s);
			if (!s) return null;
			return this.metadataFromStat_(s);
		} catch (error) {
			throw this.fsErrorToJsError_(error);
		}
	}

	metadataFromObject_(object) {
		return {
			path: object.Content.id,
			// created_time: ,
			updated_time: object.TimeStamp / 1000000,
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

	// done
	async setTimestamp(path, timestampMs) {
		if (this.isLocalFile(path)) {
			path = this.localFileFullPath(path);
			try {
				await this.fsDriver().setTimestamp(path, new Date(timestampMs));
			} catch (error) {
				throw this.fsErrorToJsError_(error);
			}
		}
		throw new Error('Not implemented'); // Not needed anymore
	}

	// done
	async delta(path, options) {
		console.log('test delta');
		console.log(path);
		console.log(this.isLocalFile(path));

		const getDirStats = async path => {
			const result = await this.list(path);
			return result.items;
		};

		return await basicDelta(path, getDirStats, options);
	}


	// done
	async list(path) {
		console.log('test list');
		console.log(path);
		console.log(this.isLocalFile(path));
		try {
			const QuorumClient = window.QuorumClient;
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
		} catch (error) {
			console.log(error);
		}
		try {
		  path = this.localFileFullPath(path);
			const stats = await this.fsDriver().readDirStats(path);
			console.log(stats);
			const output = this.metadataFromStats_(stats);
			console.log(output);

			return {
				items: output,
				hasMore: false,
				context: null,
			};
		} catch (error) {
			throw this.fsErrorToJsError_(error, path);
		}
	}

	// done
	async get(path, options) {
		console.log('test get');
		console.log(path);
		console.log(this.isLocalFile(path));
		if (this.isLocalFile(path)) {
			let output = null;
			try {
				const QuorumClient = window.QuorumClient;
				const object = await QuorumClient.Object.get(path);
				output = object?.Content?.content || null;
				console.log(output);
				if (options.target === 'file') {
				  await this.fsDriver().writeFile(options.path, output, 'utf8');
				}
			} catch (error) {
				console.log(error);
			}

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

			return output;
		} else {
			let output = null;
			try {
				const QuorumClient = window.QuorumClient;
				const object = await QuorumClient.Object.get(path);
				output = object?.Content?.content || null;
				console.log(output);
				if (options.target === 'file') {
				  await this.fsDriver().writeFile(options.path, output, 'utf8');
				}
			} catch (error) {
				console.log(error);
			}

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

			return output;

		}
	}

	// done
	async mkdir(path) {
		console.log('test mkdir');
		console.log(path);
		if (this.isLocalFile(path)) {
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

	// done
	async put(path, content, options = null) {
		console.log('test put');
		console.log(path);
		if (!options) options = {};
		if (this.isLocalFile(path)) {
			const keyPath = path;
			path = this.localFileFullPath(path);
			try {
				if (options.source === 'file') {
					await this.fsDriver().copy(options.path, path);
					try {
						const content = await this.fsDriver().readFile(options.path);
						const QuorumClient = window.QuorumClient;
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

				await this.fsDriver().writeFile(path, content, 'utf8');

				try {
					const QuorumClient = window.QuorumClient;
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
			} catch (error) {
				throw this.fsErrorToJsError_(error, path);
			}
		} else {
			const keyPath = path;
			path = this.localFileFullPath(path);
			try {
				if (options.source === 'file') {
					await this.fsDriver().copy(options.path, path);
					try {
						const content = await this.fsDriver().readFile(options.path);
						const QuorumClient = window.QuorumClient;
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

				await this.fsDriver().writeFile(path, content, 'utf8');

				try {
					const QuorumClient = window.QuorumClient;
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
			} catch (error) {
				throw this.fsErrorToJsError_(error, path);
			}
		}
	}

	// done
	async delete(path) {
		console.log('test delete');
		console.log(path);
		console.log(this.isLocalFile(path));
		try {
			const QuorumClient = window.QuorumClient;
			await QuorumClient.Object.delete(Setting.value('sync.11.group').group_id, path);
		} catch (error) {
			console.log(error);
		}
		try {
		  path = this.localFileFullPath(path);
			await this.fsDriver().unlink(path);
		} catch (error) {
			throw this.fsErrorToJsError_(error, path);
		}
	}

	// done
	async move(oldPath, newPath) {
		console.log('test move');
		console.log(oldPath, newPath);
		if (oldPath === newPath) return;
		try {
			const content = await this.get(oldPath);
			await this.put(newPath, content);
			await this.delete(oldPath);
		} catch {}
	}

	// done
	format() {
		throw new Error('Not supported');
	}

	// done
	async clearRoot(baseDir) {
		baseDir = this.localFileFullPath(baseDir);
		console.log('test clearRoot');
		console.log(baseDir);
		await this.fsDriver().remove(baseDir);
		await this.fsDriver().mkdir(baseDir);
		try {
			const QuorumClient = window.QuorumClient;
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
