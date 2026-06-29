import { filterNavGroups } from "./src/lib/permissions";
import { sidebarData } from "./src/components/layout/data/sidebar-data";

const user = {
    "id": 2,
    "name": "Eng. Maksudul Haque",
    "email": "maksud@sheba.com",
    "role_id": 4,
    "is_active": 1,
    "created_at": "2026-06-18T17:34:10.000Z",
    "userType": "staff",
    "role": "viewer",
    "subdomain": "sheba",
    "hide_subscription_info": 1,
    "permissions": [
        "outdoor.master.tests.edit",
        "outdoor.master.test-tables.view",
        "outdoor.master.tests.create",
        "outdoor.master.tests.view",
        "outdoor.master.departments.view",
        "outdoor.master.categories.view",
        "outdoor.master.doctors.view",
        "outdoor.master.machines.view",
        "outdoor.master.sample-collection-rooms.view",
        "outdoor.master.test-tables.create",
        "outdoor.master.departments.create",
        "outdoor.master.categories.create",
        "outdoor.master.doctors.create",
        "outdoor.master.machines.create",
        "outdoor.master.sample-collection-rooms.create",
        "outdoor.master.test-tables.edit",
        "outdoor.master.departments.edit",
        "outdoor.master.categories.edit",
        "outdoor.master.doctors.edit",
        "outdoor.master.machines.edit",
        "outdoor.master.sample-collection-rooms.edit",
        "outdoor.master.tests.delete",
        "outdoor.master.test-tables.delete",
        "outdoor.master.departments.delete",
        "outdoor.master.categories.delete",
        "outdoor.master.doctors.delete",
        "outdoor.master.machines.delete",
        "outdoor.master.sample-collection-rooms.delete",
        "indoor.master.services.view",
        "indoor.master.service-categories.view",
        "indoor.master.treatment-outcomes.view",
        "indoor.master.operation-types.view",
        "indoor.master.anasthesia-types.view",
        "indoor.master.bed-resource-types.view",
        "indoor.master.bed-wards.view",
        "indoor.master.bed-cabin-types.view",
        "indoor.master.bed-cabin-list.view",
        "indoor.master.doctor-types.view",
        "indoor.master.patient-types.view",
        "indoor.master.services.create",
        "indoor.master.service-categories.create",
        "dashboard.view"
    ],
    "menu": []
};

const hideSubscription = true;

const baseGroups = hideSubscription
    ? sidebarData.navGroups.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.url !== '/dashboard/subscription'
        ),
      }))
    : sidebarData.navGroups;

const result = filterNavGroups(user as any, baseGroups as any);
console.log(JSON.stringify(result, null, 2));
