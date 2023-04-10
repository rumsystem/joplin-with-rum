import Setting from './models/Setting';
import Logger from './Logger';
import QuorumSDK from 'quorum-sdk-electron-renderer';

export enum StartState {
	Idle = 'idle',
	Starting = 'starting',
	Started = 'started',
}

export default class QuorumServer {

	private logger_: Logger;
	private client_: QuorumSDK;
	private startState_: StartState = StartState.Idle;
	private dispatch_: Function;

	private static instance_: QuorumServer = null;

	constructor() {
		this.logger_ = new Logger();
		this.client_ = new QuorumSDK(); 
	}

	static instance() {
		if (this.instance_) return this.instance_;
		this.instance_ = new QuorumServer();
		return this.instance_;
	}

	client() {
		return this.client_;
	}

	setLogger(l: Logger) {
		this.logger_ = l;
	}

	logger() {
		return this.logger_;
	}

	setDispatch(d: Function) {
		this.dispatch_ = d;
	}

	dispatch(action: any) {
		if (!this.dispatch_) throw new Error('dispatch not set!');
		this.dispatch_(action);
	}

	setStartState(v: StartState) {
		if (this.startState_ === v) return;
		this.startState_ = v;
		this.dispatch({
			type: 'QUORUM_SERVER_SET',
			startState: v,
		});
	}

	async start() {
		this.setStartState(StartState.Starting);

		try {
			await this.client_.up();
			const groups = await this.client_.Group.list() || [];
			if (groups.length > 0) {
				Setting.setValue('sync.11.group', groups[0]);
			} else {
				const group = await this.client_.Group.create({
					group_name: 'joplin',
					consensus_type: 'poa',
					encryption_type: 'public',
					app_key: 'group_note',
				});
				Setting.setValue('sync.11.group', group);
			}
		} catch (error) {
			this.setStartState(StartState.Idle);
			this.logger().error(error);
			return;
		}

		this.logger().info(`Synchronise on rumsystem group ${Setting.value('sync.11.group').group_id}`);

		this.setStartState(StartState.Started);
	}

	async stop() {
		this.client_.down();
		this.setStartState(StartState.Idle);
	}
}
