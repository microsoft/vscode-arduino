#include <map>
#include <string.h>
#include <stdio.h>

#include "deviceList.h"


using namespace std;

map<string, DeviceItem_t*> deviceMap;

void AddItemToList(char* key, DeviceItem_t * item) {
	item->SetKey(key);
	deviceMap.insert(pair<string, DeviceItem_t*>(item->GetKey(), item));
}

void RemoveItemFromList(DeviceItem_t* item) {
	deviceMap.erase(item->GetKey());
}

DeviceItem_t* GetItemFromList(char* key) {
	map<string, DeviceItem_t*>::iterator it;

	it = deviceMap.find(key);
	if(it == deviceMap.end()) {
		return NULL;
	}
	else {
		return it->second;
	}
}

bool IsItemAlreadyStored(char* key) {
	map<string, DeviceItem_t*>::iterator it;

	it = deviceMap.find(key);
	if(it == deviceMap.end()) {
		return false;
	}
	else {
		return true;
	}

	return true;
}

ListResultItem_t* CopyElement(ListResultItem_t* item) {
    ListResultItem_t* dst = new ListResultItem_t();
    dst->locationId     =   item->locationId;
    dst->vendorId       =   item->vendorId;
    dst->productId      =   item->productId;
    dst->deviceName     =   item->deviceName;
    dst->manufacturer   =   item->manufacturer;
    dst->serialNumber   =   item->serialNumber;
    dst->deviceAddress  =   item->deviceAddress;

    return dst;
}

void CreateFilteredList(list<ListResultItem_t*> *filteredList, int vid, int pid) {
	map<string, DeviceItem_t*>::iterator it;

	for (it = deviceMap.begin(); it != deviceMap.end(); ++it) {
    	DeviceItem_t* item = it->second;

        if (
        	((	vid != 0 && pid != 0) && (vid == item->deviceParams.vendorId && pid == item->deviceParams.productId))
        	|| 	((vid != 0 && pid == 0) && vid == item->deviceParams.vendorId)
        	||	(vid == 0 && pid == 0)
    	) {
        	(*filteredList).push_back(CopyElement(&item->deviceParams));
        }

    }
}
