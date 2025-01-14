import { MongoHelper } from '../utils/MongoHelper';
import { URL_MONGODB } from '../utils/constants';
import { roomMock } from '../utils/mocks/roomMock';
import { userMock } from '../utils/mocks/userMock';
import { subscriptionMock } from '../utils/mocks/subscriptionMock';

const insertRoom = async (): Promise<void> => {
	const roomCollection = await MongoHelper.getCollection('rocketchat_room');
	await roomCollection.insertMany(roomMock);
};

const insertUser = async (): Promise<void> => {
	const userCollection = await MongoHelper.getCollection('users');
	await userCollection.insertOne(userMock);
};

const subscribeUserInChannels = async (): Promise<void> => {
	const subscribeCollections = await MongoHelper.getCollection('rocketchat_subscription');
	await subscribeCollections.insertMany(subscriptionMock);
};

export default async (): Promise<void> => {
	await MongoHelper.connect(URL_MONGODB);
	await insertRoom();
	await insertUser();
	await subscribeUserInChannels();
	await MongoHelper.disconnect();
};
