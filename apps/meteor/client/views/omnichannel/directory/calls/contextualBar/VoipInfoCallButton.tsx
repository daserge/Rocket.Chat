import { Button, Icon, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useVoipOutboundStates } from '../../../../../contexts/CallContext';
import { useDialModal } from '../../../../../hooks/useDialModal';

export const VoipInfoCallButton = ({ phoneNumber, ...props }: { phoneNumber: string }): ReactElement => {
	const t = useTranslation();

	const { openDialModal } = useDialModal();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();
	return (
		<Button
			{...props} // this props are injected by ButtonGroup
			onClick={(): void => openDialModal({ initialValue: phoneNumber })}
			disabled={!outBoundCallsEnabledForUser}
			title={outBoundCallsAllowed ? t('Call_number') : t('Call_number_enterprise_only')}
		>
			<Box display='flex' justifyContent='center' fontSize='p2'>
				<Icon name='phone' size='x20' mie='4px' />
				{t('Call')}
			</Box>
		</Button>
	);
};
