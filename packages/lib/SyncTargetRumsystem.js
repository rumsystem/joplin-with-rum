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

	static unsupportedPlatforms() {
		return ['ios'];
	}

	async isAuthenticated() {
		return true;
	}

	async initFileApi() {
		const driver = new FileApiDriverRum();
		const fileApi = new FileApi('', driver);
		fileApi.setLogger(this.logger());
		fileApi.setSyncTargetId(SyncTargetRumsystem.id());
		await driver.mkdir('');
		return fileApi;
	}

	async initSynchronizer() {
		return new Synchronizer(this.db(), await this.fileApi(), Setting.value('appType'));
	}
}

module.exports = SyncTargetRumsystem;
