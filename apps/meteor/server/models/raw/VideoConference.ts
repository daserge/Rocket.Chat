import type {
	Cursor,
	UpdateOneOptions,
	UpdateQuery,
	UpdateWriteOpResult,
	IndexSpecification,
	Collection,
	Db,
	FindOneOptions,
	FilterQuery,
} from 'mongodb';
import type {
	VideoConference,
	IGroupVideoConference,
	ILivechatVideoConference,
	IUser,
	IRoom,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type { InsertionModel, IVideoConferenceModel } from '@rocket.chat/model-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class VideoConferenceRaw extends BaseRaw<VideoConference> implements IVideoConferenceModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<VideoConference>>) {
		super(db, getCollectionName('video_conference'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [
			{ key: { rid: 1, createdAt: 1 }, unique: false },
			{ key: { type: 1, status: 1 }, unique: false },
		];
	}

	public async findAllByRoomId(
		rid: IRoom['_id'],
		{ offset, count }: { offset?: number; count?: number } = {},
	): Promise<Cursor<VideoConference>> {
		return this.find(
			{ rid },
			{
				sort: { createdAt: -1 },
				skip: offset,
				limit: count,
				projection: {
					providerData: 0,
				},
			},
		);
	}

	public async findAllLongRunning(minDate: Date): Promise<Cursor<Pick<VideoConference, '_id'>>> {
		return this.find(
			{
				createdAt: {
					$lte: minDate,
				},
				endedAt: {
					$exists: false,
				},
			},
			{
				projection: {
					_id: 1,
				},
			},
		);
	}

	public async countByTypeAndStatus(
		type: VideoConference['type'],
		status: VideoConferenceStatus,
		options: FindOneOptions<VideoConference>,
	): Promise<number> {
		return this.find(
			{
				type,
				status,
			} as FilterQuery<VideoConference>,
			options,
		).count();
	}

	public async createDirect({
		providerName,
		...callDetails
	}: Pick<VideoConference, 'rid' | 'createdBy' | 'providerName'>): Promise<string> {
		const call: InsertionModel<VideoConference> = {
			type: 'direct',
			users: [],
			messages: {},
			status: VideoConferenceStatus.CALLING,
			createdAt: new Date(),
			providerName: providerName.toLowerCase(),
			ringing: true,
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public async createGroup({
		providerName,
		...callDetails
	}: Required<Pick<IGroupVideoConference, 'rid' | 'title' | 'createdBy' | 'providerName' | 'ringing'>>): Promise<string> {
		const call: InsertionModel<IGroupVideoConference> = {
			type: 'videoconference',
			users: [],
			messages: {},
			status: VideoConferenceStatus.STARTED,
			anonymousUsers: 0,
			createdAt: new Date(),
			providerName: providerName.toLowerCase(),
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public async createLivechat({
		providerName,
		...callDetails
	}: Required<Pick<ILivechatVideoConference, 'rid' | 'createdBy' | 'providerName'>>): Promise<string> {
		const call: InsertionModel<ILivechatVideoConference> = {
			type: 'livechat',
			users: [],
			messages: {},
			status: VideoConferenceStatus.STARTED,
			createdAt: new Date(),
			providerName: providerName.toLowerCase(),
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public updateOneById(
		_id: string,
		update: UpdateQuery<VideoConference> | Partial<VideoConference>,
		options?: UpdateOneOptions,
	): Promise<UpdateWriteOpResult> {
		return this.updateOne({ _id }, update, options);
	}

	public async setEndedById(callId: string, endedBy?: { _id: string; name: string; username: string }, endedAt?: Date): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				endedBy,
				endedAt: endedAt || new Date(),
			},
		});
	}

	public async setDataById(callId: string, data: Partial<Omit<VideoConference, '_id'>>): Promise<void> {
		await this.updateOneById(callId, {
			$set: data,
		});
	}

	public async setRingingById(callId: string, ringing: boolean): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				ringing,
			},
		});
	}

	public async setStatusById(callId: string, status: VideoConference['status']): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				status,
			},
		});
	}

	public async setUrlById(callId: string, url: string): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				url,
			},
		});
	}

	public async setProviderDataById(callId: string, providerData: Record<string, any> | undefined): Promise<void> {
		await this.updateOneById(callId, {
			...(providerData
				? {
						$set: {
							providerData,
						},
				  }
				: {
						$unset: {
							providerData: 1,
						},
				  }),
		});
	}

	public async addUserById(callId: string, user: Pick<IUser, '_id' | 'name' | 'username' | 'avatarETag'> & { ts?: Date }): Promise<void> {
		await this.updateOneById(callId, {
			$addToSet: {
				users: {
					_id: user._id,
					username: user.username,
					name: user.name,
					avatarETag: user.avatarETag,
					ts: user.ts || new Date(),
				},
			},
		});
	}

	public async setMessageById(callId: string, messageType: keyof VideoConference['messages'], messageId: string): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				[`messages.${messageType}`]: messageId,
			},
		});
	}

	public async updateUserReferences(userId: IUser['_id'], username: IUser['username'], name: IUser['name']): Promise<void> {
		await this.updateMany(
			{
				'users._id': userId,
			},
			{
				$set: {
					'users.$.name': name,
					'users.$.username': username,
				},
			},
		);

		await this.updateMany(
			{
				'createdBy._id': userId,
			},
			{
				$set: {
					'createdBy.name': name,
					'createdBy.username': username,
				},
			},
		);

		await this.updateMany(
			{
				'endedBy._id': userId,
			},
			{
				$set: {
					'endedBy.name': name,
					'endedBy.username': username,
				},
			},
		);
	}

	public async increaseAnonymousCount(callId: IGroupVideoConference['_id']): Promise<void> {
		await this.updateOne(
			{ _id: callId },
			{
				$inc: {
					anonymousUsers: 1,
				},
			},
		);
	}
}
