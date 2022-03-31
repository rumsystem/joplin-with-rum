const BaseSyncTarget = require('./BaseSyncTarget').default;
const { _ } = require('./locale');
const Setting = require('./models/Setting').default;
const { FileApi } = require('./file-api.js');
const { FileApiDriverRum } = require('./file-api-driver-rum.js');
const Synchronizer = require('./Synchronizer').default;

class SyncTargetRumsystem extends BaseSyncTarget {
	static id() {
		return 11;
	}

	static targetName() {
		return 'rumsystem';
	}

	static label() {
		return _('Rum system');
	}

	async isAuthenticated() {
		return true;
	}

	async initFileApi() {
		const syncPath = Setting.value('sync.11.path');
		const driver = new FileApiDriverRum();
		const fileApi = new FileApi(syncPath, driver);
		fileApi.setLogger(this.logger());
		fileApi.setSyncTargetId(SyncTargetRumsystem.id());
		await driver.mkdir(syncPath);
		return fileApi;
	}

	async initSynchronizer() {
		return new Synchronizer(this.db(), await this.fileApi(), Setting.value('appType'));
	}
}

module.exports = SyncTargetRumsystem;
