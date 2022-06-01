import { Meteor } from 'meteor/meteor';

import { hasAllPermission } from '../../../app/authorization/client';
import { registerAdminRoute, registerAdminSidebarItem, unregisterAdminSidebarItem } from '../../../client/views/admin';
import { onToggledFeature } from '../lib/onToggledFeature';

const [registerRoute, unregisterRoute] = registerAdminRoute('/device-management/:context?/:id?', {
	name: 'device-management',
	lazyRouteComponent: () => import('../views/admin/deviceManagement/DeviceManagementRoute'),
	ready: false,
});

onToggledFeature('device-management', {
	up: () =>
		Meteor.startup(() => {
			registerAdminSidebarItem({
				href: '/admin/device-management',
				i18nLabel: 'Device Management',
				icon: 'mobile',
				permissionGranted: () => hasAllPermission('view-device-management'),
			});
			registerRoute();
		}),
	down: () =>
		Meteor.startup(() => {
			unregisterAdminSidebarItem('Device Management');
			unregisterRoute();
		}),
});