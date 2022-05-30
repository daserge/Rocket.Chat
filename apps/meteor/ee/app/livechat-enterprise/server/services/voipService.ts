import { IRoomClosingInfo, IVoipRoom } from '@rocket.chat/core-typings';

import { IOmniRoomClosingMessage } from '../../../../../server/services/omnichannel-voip/internalTypes';
import { OmnichannelVoipService } from '../../../../../server/services/omnichannel-voip/service';
import { overwriteClassOnLicense } from '../../../license/server';
import { calculateOnHoldTimeForRoom } from '../lib/voip/helper';

overwriteClassOnLicense('livechat-enterprise', OmnichannelVoipService, {
	getRoomClosingData(
		_originalFn: any,
		closeInfo: IRoomClosingInfo,
		closeSystemMsgData: IOmniRoomClosingMessage,
		room: IVoipRoom,
		sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
		options?: { comment?: string; tags?: string[] },
	): { closeInfo: IRoomClosingInfo; closeSystemMsgData: IOmniRoomClosingMessage } {
		const { comment, tags } = options || {};
		if (comment) {
			closeSystemMsgData.msg = comment;
		}
		if (tags?.length) {
			closeInfo.tags = tags;
		}

		if (sysMessageId === 'voip-call-wrapup' && !comment) {
			closeSystemMsgData.t = 'voip-call-ended';
		}

		const now = new Date();
		const callTotalHoldTime = Promise.await(calculateOnHoldTimeForRoom(room, now));
		closeInfo.callTotalHoldTime = callTotalHoldTime;

		return { closeInfo, closeSystemMsgData };
	},
});
